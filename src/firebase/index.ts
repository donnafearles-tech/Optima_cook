'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Moviendo la configuración aquí para centralizarla
export const firebaseConfig = {
  "apiKey": "AIzaSyBFD6y9l0oUCc41xaMmL3__n3-zYFjHf8w",
  "projectId": "studio-99491860-5533f",
  "appId": "1:941568288177:web:7dcd9a4d3cf17c715b0990",
  "authDomain": "studio-99491860-5533f.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "941568288177"
};


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
     try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
     } catch (e) {
        if (e instanceof Error && !e.message.includes('already connected')) {
            console.error('Error connecting to Firebase Auth emulator:', e);
        }
     }
  }

  return {
    firebaseApp: app,
    auth: auth,
    firestore: getFirestore(app)
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
export * as auth from './auth';