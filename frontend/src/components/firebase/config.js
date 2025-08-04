import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;