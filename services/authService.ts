import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
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

// In-memory cache to speed up repeated reads
let userDataCache: { [email: string]: UserData } = {};

export const AuthService = {
  // --- Validation Helpers ---
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPassword: (password: string): boolean => {
    return password.length >= 6;
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
      console.log(`[DEV MODE] Password Reset Requested for ${email}`);
      return {
        success: true,
        message: "Dev Mode: Password reset email simulated. (Check Console)"
      };
    }

    return { success: false, message: "User not found." };
  },

  signup: async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // 1. Try Firebase (Real Backend)
    try {
      if (auth) {
        await createUserWithEmailAndPassword(auth, email, password);

        // Initialize user data in Firestore
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
        await AuthService.saveUserData(email, initialData);
        return { success: true };
      }
    } catch (error: any) {
      if (auth) return { success: false, message: error.message };
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

  login: async (email: string, password: string): Promise<{ success: boolean; message?: string; name?: string }> => {
    // 1. Try Firebase
    try {
      if (auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const name = userCredential.user.email?.split('@')[0];
        return { success: true, name };
      }
    } catch (error: any) {
      if (auth) return { success: false, message: error.message };
    }

    // 2. Fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '{}');
    const user = users[email];
    if (!user) return { success: false, message: 'User not found.' };
    if (user.password !== password) return { success: false, message: 'Incorrect password.' };
    return { success: true, name: user.name };
  },

  // --- Data Management ---

  saveUserData: async (email: string, data: UserData): Promise<void> => {
    // Update cache immediately
    userDataCache[email] = data;

    if (db) {
      try {
        // Firestore doesn't accept 'undefined', so we strip those fields
        const sanitizedData = JSON.parse(JSON.stringify(data));
        await setDoc(doc(db, "users", email), sanitizedData);
        return;
      } catch (e) {
        console.error("Firestore save failed:", e);
      }
    }
    localStorage.setItem(DATA_PREFIX + email, JSON.stringify(data));
  },

  getUserData: async (email: string): Promise<UserData | null> => {
    // Check cache first
    if (userDataCache[email]) {
      return userDataCache[email];
    }

    if (db) {
      try {
        const docSnap = await getDoc(doc(db, "users", email));
        if (docSnap.exists()) {
          const data = docSnap.data() as UserData;
          userDataCache[email] = data; // Populate cache
          return data;
        }
      } catch (e) {
        console.error("Firestore read failed:", e);
      }
    }
    const data = localStorage.getItem(DATA_PREFIX + email);
    const parsed = data ? JSON.parse(data) : null;
    if (parsed) userDataCache[email] = parsed;
    return parsed;
  }
};
