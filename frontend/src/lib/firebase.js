/**
 * Firebase client setup. Only Authentication is used in the browser:
 * all data goes through the MindMate API (see src/lib/api.js).
 *
 * Config comes from environment variables (frontend/.env). The Firebase web
 * config identifies the project; it is not a secret, but it is kept out of
 * source so each environment can point at its own project.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
};

const useEmulator = env.VITE_USE_FIREBASE_EMULATOR === 'true';

/** True when enough config exists to talk to Firebase Auth. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId) || useEmulator;
export const googleSignInEnabled = env.VITE_ENABLE_GOOGLE_SIGNIN !== 'false' && !useEmulator;

let auth = null;
if (firebaseConfigured) {
  const app = initializeApp(
    useEmulator ? { apiKey: 'demo-key', projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-mindmate', authDomain: 'localhost' } : config
  );
  auth = getAuth(app);
  if (useEmulator) {
    connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR_URL || 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export { auth };
export const googleProvider = new GoogleAuthProvider();

/** Turns Firebase Auth error codes into calm, specific messages. */
export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'That email and password don’t match an account. Check them and try again.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters with a letter and a number).';
    case 'auth/too-many-requests':
      return 'Too many attempts. For your security, please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'We couldn’t reach the sign-in service. Check your internet connection.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google sign-in window was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn’t enabled for MindMate yet.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already linked to a different sign-in method.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/requires-recent-login':
      return 'For your security, please sign in again before doing this.';
    case 'auth/unauthorized-domain':
      return 'This website isn’t authorised for sign-in yet. Add it under Firebase → Authentication → Settings → Authorised domains.';
    default:
      return 'Something went wrong with sign-in. Please try again.';
  }
}
