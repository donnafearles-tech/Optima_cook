'use client';

import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  FirebaseError,
} from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';


/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(err => {
      // Errors are handled by the onAuthStateChanged listener's error callback
      // or by a global error handler if one is set up.
      console.error("Sign up failed:", err);
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth, 
  email: string, 
  password: string,
  onError?: (error: FirebaseError) => void
): void  {
  signInWithEmailAndPassword(authInstance, email, password).catch((err: FirebaseError) => {
    if (onError) {
      onError(err);
    } else {
      console.error("Sign in failed:", err);
    }
  });
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider).catch((err: FirebaseError) => {
    // This is a common scenario and not a true "error" to be logged.
    if (err.code !== 'auth/popup-closed-by-user') {
      console.error("Google sign in failed:", err);
    }
  });
}

/** Initiate sign-out (non-blocking). */
export function initiateSignOut(authInstance: Auth): void {
  signOut(authInstance).catch(err => {
      console.error("Sign out failed:", err);
  });
}


export * from './use-user';
export { useFirebase };
