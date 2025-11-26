'use client';

import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup, // <--- CAMBIO IMPORTANTE: Importamos Popup
  GoogleAuthProvider,
  signOut,
  UserCredential,
} from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';


/** Iniciar registro con Email/Password */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  return await createUserWithEmailAndPassword(authInstance, email, password);
}

/** Iniciar sesión con Email/Password */
export async function initiateEmailSignIn(
  authInstance: Auth, 
  email: string, 
  password: string,
): Promise<UserCredential>  {
  return await signInWithEmailAndPassword(authInstance, email, password);
}

/** * CAMBIO CRÍTICO: Iniciar sesión con Google usando POPUP.
 * Esto evita el bucle de redirección en Cloud Workstations.
 * Retorna directamente el resultado del usuario.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // Usamos signInWithPopup en lugar de signInWithRedirect
  return await signInWithPopup(authInstance, provider);
}

/** Cerrar sesión */
export async function initiateSignOut(authInstance: Auth): Promise<void> {
  return await signOut(authInstance);
}

export * from './use-user';
export { useFirebase };
