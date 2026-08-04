import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from "firebase/analytics";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isFirebaseConfigured = Boolean(
    apiKey && 
    typeof apiKey === 'string' && 
    apiKey.trim() !== '' && 
    apiKey !== 'undefined' && 
    !apiKey.includes('YOUR_')
);

const firebaseConfig = {
    apiKey: apiKey || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
        db = getFirestore(app);
    } catch (error) {
        console.warn("Firebase initialization skipped (invalid or missing keys):", error);
    }
} else {
    console.warn("Firebase API key missing or invalid. Application is running in Local Storage Fallback mode.");
}

export { auth, googleProvider, db };
export const analytics = app ? isSupported().then(yes => yes ? getAnalytics(app!) : null) : Promise.resolve(null);

