
'use client';

import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';


/** Initiate email/password sign-up. Returns a promise that resolves on success or rejects on error. */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in. Returns a promise that resolves on success or rejects on error. */
export async function initiateEmailSignIn(
  authInstance: Auth, 
  email: string, 
  password: string,
): Promise<UserCredential>  {
  return await signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in redirect. Returns a promise that resolves on success or rejects on error. */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  return await signInWithRedirect(authInstance, provider);
}

/** Handles the result from a Google sign-in redirect. Returns a promise that resolves on success or rejects on error. */
export async function handleRedirectResult(authInstance: Auth): Promise<UserCredential | null> {
    return await getRedirectResult(authInstance);
}


/** Initiate sign-out. Returns a promise that resolves on success or rejects on error. */
export async function initiateSignOut(authInstance: Auth): Promise<void> {
  return await signOut(authInstance);
}


export * from './use-user';
export { useFirebase };
