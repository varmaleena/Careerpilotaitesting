import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebaseConfig';
import { UserProfile, CareerAnalysis, WeeklyPlan, ProjectIdea, ChatMessage, InterviewFeedback, ResumeOptimizationResult } from '../types';

// Fallback for dev without keys
const USERS_DB_KEY = 'cp_users_v2';
const DATA_PREFIX = 'cp_data_v2_';

interface UserData {
  userProfile: UserProfile;
  analysis: CareerAnalysis | null;
  plan: WeeklyPlan[] | null;
  projects: ProjectIdea[];
  chatMessages: ChatMessage[];
  interviewFeedback: InterviewFeedback | null;
  resumeAnalysisResult: ResumeOptimizationResult | null;
  seenProjectTitles?: string[];
}

// In-memory cache to speed up repeated reads (keyed by UID)
let userDataCache: { [userId: string]: UserData } = {};

export const AuthService = {
  // --- Validation Helpers ---
  isValidEmail: (email: string): boolean => {
    // Standard email format: user@domain.extension
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  },

  isValidPassword: (password: string): boolean => {
    // Minimum 8 characters, at least one number, at least one special character
    if (password.length < 8) return false;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    return hasNumber && hasSpecialChar;
  },

  getPasswordValidationErrors: (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/\d/.test(password)) errors.push("At least one number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push("At least one special character (!@#$%^&*...)");
    return errors;
  },

  // --- Auth Actions ---

  resetPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    // 1. Try Firebase (Real Backend)
    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Password reset link sent to your email." };
      }
    } catch (error: any) {
      console.warn("Firebase reset failed, checking local storage fallback...", error.code);
      // Continue to fallback if it's a configuration/dev credential issue or user-not-found (might be local user)
    }

    // 2. Fallback to LocalStorage (Dev Mode / Localhost)
    // Check if user exists in local storage to give a meaningful "simulated" response
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    if (users[email]) {
      // DEV HELPER: Actually reset the password so the user isn't locked out of their local test account
      users[email].password = "12345678$"; // Simple default with special char to pass regex
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

      console.log(`[DEV MODE] Password Reset for ${email} to '12345678$'`);
      return {
        success: true,
        message: "Dev Mode: Local password reset to '12345678$'. Try logging in now."
      };
    }

    return { success: false, message: "User not found." };
  },

  signup: async (email: string, password: string): Promise<{ success: boolean; message?: string; uid?: string }> => {
    // 1. Try Firebase (Real Backend)
    try {
      if (auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Initialize user data in Firestore using UID as document key
        const initialData: UserData = {
          userProfile: { name: email.split('@')[0], targetRole: '' },
          analysis: null,
          plan: null,
          projects: [],
          chatMessages: [],
          interviewFeedback: null,
          resumeAnalysisResult: null,
          seenProjectTitles: []
        };
        await AuthService.saveUserData(uid, initialData);
        return { success: true, uid };
      }
    } catch (error: any) {
      console.warn("Firebase signup error:", error.code, error.message);
      // Only return specific validation errors. For backend/network issues, fall back to local storage.
      const fatalErrors = ['auth/email-already-in-use', 'auth/invalid-email', 'auth/weak-password'];
      if (auth && fatalErrors.includes(error.code)) {
        return { success: false, message: error.message };
      }
      // Continue execution to fallback...
    }

    // 2. Fallback to LocalStorage (Dev Mode)
    console.warn("Firebase not configured. Using LocalStorage fallback.");
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    if (users[email]) return { success: false, message: 'User already exists.' };

    users[email] = { email, password, name: email.split('@')[0], createdAt: Date.now() };
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    const initialData = {
      userProfile: { name: email.split('@')[0], targetRole: '' },
      analysis: null, plan: null, projects: [], chatMessages: [], interviewFeedback: null,
      resumeAnalysisResult: null, seenProjectTitles: []
    };
    AuthService.saveUserData(email, initialData);
    return { success: true };
  },

  login: async (email: string, password: string): Promise<{ success: boolean; message?: string; name?: string; uid?: string }> => {
    let firebaseError = null;

    // 1. Try Firebase
    try {
      if (auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const name = userCredential.user.email?.split('@')[0];
        const uid = userCredential.user.uid;
        return { success: true, name, uid };
      }
    } catch (error: any) {
      console.warn("Firebase login failed:", error.code);
      firebaseError = error.message;
    }

    // 2. Fallback to LocalStorage (Dev Mode / Legacy Users)
    // We check this if Firebase failed OR if Firebase wasn't initialized
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    const user = users[email];

    if (user) {
      // User exists locally
      if (user.password === password) {
        return { success: true, name: user.name };
      } else {
        // Exists locally but wrong password. 
        // If we also had a simplified Firebase "User not found" error, return this specific Local "Incorrect password"
        // If Firebase said "Wrong password", they likely meant the Firebase account.
        // Let's prioritize the specific local error if we found the user locally.
        return { success: false, message: 'Incorrect password.' };
      }
    }

    // 3. User not found locally either.
    // If we had a Firebase error, return that. Otherwise "User not found".
    if (firebaseError) {
      return { success: false, message: firebaseError };
    }

    return { success: false, message: 'User not found.' };
  },

  loginWithGoogle: async (): Promise<{ success: boolean; message?: string; name?: string; email?: string; uid?: string }> => {
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const uid = user.uid;
        const name = user.displayName || user.email?.split('@')[0];

        // Check if user data exists, if not create initial structure using UID
        const existingData = await AuthService.getUserData(uid);
        if (!existingData) {
          const initialData: UserData = {
            userProfile: { name: name || 'User', targetRole: '' },
            analysis: null,
            plan: null,
            projects: [],
            chatMessages: [],
            interviewFeedback: null,
            resumeAnalysisResult: null,
            seenProjectTitles: []
          };
          await AuthService.saveUserData(uid, initialData);
        }

        return { success: true, name: name, email: user.email!, uid };
      }
      return { success: false, message: "Auth not initialized" };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // --- Data Management ---

  saveUserData: async (userId: string, data: UserData): Promise<void> => {
    // Update cache immediately (keyed by UID)
    userDataCache[userId] = data;

    if (db) {
      try {
        // Firestore doesn't accept 'undefined', so we strip those fields
        const sanitizedData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, "users", userId), sanitizedData);
        return;
      } catch (e) {
        console.error("Firestore save failed:", e);
      }
    }
    localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
  },

  getUserData: async (userId: string): Promise<UserData | null> => {
    // Check cache first
    if (userDataCache[userId]) {
      return userDataCache[userId];
    }

    if (db) {
      try {
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          userDataCache[userId] = data; // Populate cache
          return data;
        }
      } catch (e) {
        console.error("Firestore read failed:", e);
      }
    }
    const data = localStorage.getItem(DATA_PREFIX + userId);
    const parsed = data ? JSON.parse(data) : null;
    if (parsed) userDataCache[userId] = parsed;
    return parsed;
  }
};
