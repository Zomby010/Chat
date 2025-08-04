// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4gvauSXaLENDkgDOb_uoUc1khqH5IC44",
  authDomain: "mindmate-6c7c6.firebaseapp.com",
  projectId: "mindmate-6c7c6",
  storageBucket: "mindmate-6c7c6.firebasestorage.app",
  messagingSenderId: "625406750473",
  appId: "1:625406750473:web:23805f3cedd24c6a07add8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore with settings
export const db = getFirestore(app);

// Apply Firestore settings for better compatibility
// This can help resolve WebChannel transport errors
if (typeof window !== 'undefined') {
  // Only apply settings in browser environment
  try {
    // Force long polling if WebSocket connections are problematic
    // Note: This is for v9+ SDK, adjust if using different version
    db._delegate._databaseId = db._delegate._databaseId;
  } catch (error) {
    console.warn('Could not apply Firestore settings:', error);
  }
}

// Initialize providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Auth functions
export const signUpWithEmailAndPassword = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export default app;