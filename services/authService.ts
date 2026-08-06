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
  updateDoc,
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

// Cross-tab cache invalidation listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith(DATA_PREFIX)) {
      const uid = e.key.replace(DATA_PREFIX, '');
      delete userDataCache[uid];
    }
  });
}

export const getAuthToken = async (): Promise<string | null> => {
    try {
        if (auth && auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
    } catch {
        return null;
    }
    return null;
};

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

      // Continue to fallback if it's a configuration/dev credential issue or user-not-found (might be local user)
    }

    // 2. Fallback to LocalStorage (Dev Mode / Localhost)
    // Check if user exists in local storage to give a meaningful "simulated" response
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    if (users[email]) {
      // DEV HELPER: Actually reset the password so the user isn't locked out of their local test account
      users[email].password = "12345678$"; // Simple default with special char to pass regex
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));


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

      // Only return specific validation errors. For backend/network issues, fall back to local storage.
      const fatalErrors = ['auth/email-already-in-use', 'auth/invalid-email', 'auth/weak-password'];
      if (auth && fatalErrors.includes(error.code)) {
        return { success: false, message: error.message };
      }
      // Continue execution to fallback...
    }

    // 2. Fallback to LocalStorage (Dev Mode)

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

  /**
   * Full save — writes the entire user document to Firestore.
   * Use only for initial setup or full resets. Prefer granular saves below.
   */
  saveUserData: async (userId: string, data: UserData): Promise<void> => {
    // Update in-memory cache immediately
    userDataCache[userId] = data;

    if (db) {
      try {
        const sanitizedData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, "users", userId), sanitizedData);
        return;
      } catch (e) { /* fall through to localStorage */ }
    }
    localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
  },

  /**
   * Granular save: analysis only (~90% smaller Firestore write).
   */
  saveAnalysis: async (userId: string, analysis: UserData['analysis']): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], analysis };
    }
    const sanitized = JSON.parse(JSON.stringify({ analysis }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  /**
   * Granular save: weekly plan only.
   */
  savePlan: async (userId: string, plan: UserData['plan']): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], plan };
    }
    const sanitized = JSON.parse(JSON.stringify({ plan }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  /**
   * Granular save: projects only.
   */
  saveProjects: async (userId: string, projects: UserData['projects'], seenProjectTitles?: string[]): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], projects, ...(seenProjectTitles ? { seenProjectTitles } : {}) };
    }
    const sanitized = JSON.parse(JSON.stringify({ projects, ...(seenProjectTitles ? { seenProjectTitles } : {}) }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  /**
   * Granular save: user profile only.
   * Use this for profile edits — avoids overwriting analysis/plan with stale cached values.
   */
  saveProfile: async (userId: string, userProfile: UserData['userProfile']): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], userProfile };
    }
    const sanitized = JSON.parse(JSON.stringify({ userProfile }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  /**
   * Granular save: resume analysis result only.
   */
  saveResumeAnalysis: async (userId: string, resumeAnalysisResult: UserData['resumeAnalysisResult']): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], resumeAnalysisResult };
    }
    const sanitized = JSON.parse(JSON.stringify({ resumeAnalysisResult }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  /**
   * Granular save: interview feedback only.
   */
  saveInterviewFeedback: async (userId: string, interviewFeedback: UserData['interviewFeedback']): Promise<void> => {
    if (userDataCache[userId]) {
      userDataCache[userId] = { ...userDataCache[userId], interviewFeedback };
    }
    const sanitized = JSON.parse(JSON.stringify({ interviewFeedback }));
    if (db) {
      try { await updateDoc(doc(db, "users", userId), sanitized); return; } catch (e) { /* fall through */ }
    }
    const stored = localStorage.getItem(DATA_PREFIX + userId);
    if (stored) {
      const parsed = JSON.parse(stored);
      localStorage.setItem(DATA_PREFIX + userId, JSON.stringify({ ...parsed, ...sanitized }));
    }
  },

  getUserData: async (userId: string): Promise<UserData | null> => {
    // In-memory cache hit — returns in < 1ms, no Firestore call
    if (userDataCache[userId]) {
      return userDataCache[userId];
    }

    if (db) {
      try {
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          userDataCache[userId] = data;
          return data;
        }
      } catch (e) { /* fall through to localStorage */ }
    }
    const data = localStorage.getItem(DATA_PREFIX + userId);
    const parsed = data ? JSON.parse(data) : null;
    if (parsed) userDataCache[userId] = parsed;
    return parsed;
  },

  /**
   * Clear user from in-memory cache on logout.
   * Prevents stale data being served if a different user signs in same tab.
   */
  clearUserCache: (userId: string): void => {
    delete userDataCache[userId];
  },
};
