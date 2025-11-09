'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Moviendo la configuración aquí para centralizarla
export const firebaseConfig = {
  "projectId": "studio-99491860-5533f",
  "appId": "1:941568288177:web:7dcd9a4d3cf17c715b0990",
  "apiKey": "AQ.Ab8RN6LabaYV_Au0M9UosXufnAOGoD5qnbJKSHQVKvPaRDwYeA",
  "authDomain": "studio-99491860-5533f.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "941568288177"
};


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);

  // Connect to emulators only in a true local development environment, not on Cloud Workstations.
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('Firebase Auth connected to emulator.');
    } catch (error) {
        // The emulator might already be connected, which throws an error.
        // We can safely ignore this during hot-reloads.
        if (error instanceof Error && error.message.includes('already connected')) {
            // console.log('Auth emulator already connected.');
        } else {
            console.error('Error connecting to Firebase Auth emulator:', error);
        }
    }
  }

  return {
    firebaseApp,
    auth,
    firestore: getFirestore(firebaseApp)
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
