import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, firebaseConfigured, googleProvider } from '../lib/firebase';
import { api, setUnauthorizedHandler } from '../lib/api';
import { guessRegion } from '../lib/region';

const AuthContext = createContext(null);

/**
 * Single source of truth for "who is signed in".
 * status: 'loading' | 'signedOut' | 'signedIn'
 * The MindMate profile (name, region, preferences) is loaded from the API
 * after Firebase confirms the session.
 */
export function AuthProvider({ children }) {
  const [status, setStatus] = useState(firebaseConfigured ? 'loading' : 'signedOut');
  const [user, setUser] = useState(null);
  const [profile, setProfileState] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null);
  // Where protected pages should send the user after a deliberate sign-out.
  const [exitPath, setExitPath] = useState(null);
  const version = useRef(0);

  const setProfile = useCallback((p) => {
    version.current += 1;
    setProfileState(p);
  }, []);

  const loadProfile = useCallback(async () => {
    const v = version.current;
    setProfileError(null);
    try {
      let p = await api.get('/me');
      if (!p.region) p = await api.patch('/me', { region: guessRegion() });
      if (version.current === v) setProfileState(p);
      return p;
    } catch (err) {
      if (version.current === v) setProfileError(err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setExitPath(null);
        setStatus('signedIn');
        await loadProfile();
      } else {
        setProfile(null);
        setStatus('signedOut');
      }
    });
  }, [loadProfile, setProfile]);

  useEffect(() => {
    setUnauthorizedHandler(async (err) => {
      if (!auth?.currentUser) return;
      setSessionMessage(err?.message || 'Your session has ended. Please sign in again.');
      await fbSignOut(auth);
    });
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      profile,
      profileError,
      sessionMessage,
      clearSessionMessage: () => setSessionMessage(null),
      firebaseConfigured,
      reloadProfile: loadProfile,

      async signIn(email, password) {
        setSessionMessage(null);
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },

      async signInWithGoogle() {
        setSessionMessage(null);
        await signInWithPopup(auth, googleProvider);
      },

      async signUp({ name, email, password }) {
        setSessionMessage(null);
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await fbUpdateProfile(cred.user, { displayName: name });
        sendEmailVerification(cred.user).catch(() => {});
        const p = await api.patch('/me', { displayName: name, region: guessRegion() });
        setProfile(p);
      },

      resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),

      exitPath,
      async signOut({ to = '/login' } = {}) {
        setExitPath(to);
        await fbSignOut(auth);
      },

      async updateProfile(patch) {
        const p = await api.patch('/me', patch);
        setProfile(p);
        return p;
      },
    }),
    [status, user, profile, profileError, sessionMessage, exitPath, loadProfile, setProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
