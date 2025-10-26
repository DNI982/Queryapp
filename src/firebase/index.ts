'use client';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// Re-export the providers and hooks from the other files.
export { FirebaseClientProvider } from './client-provider';
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from './provider';
export { useUser, useUserRole } from './auth/use-user';


// A singleton instance of the Firebase app.
// This is to prevent re-initializing the app on every render.
let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

/**
 * Initializes the Firebase app and returns the app, auth, and firestore instances.
 * This function is idempotent, meaning it will only initialize the app once.
 *
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // This is a special case for running in a local development environment.
    // The Firebase Emulator Suite is a set of local-only services for
    // development and testing.
    //
    // In this case, we're not using the real Firebase services, but rather
    // the local emulators. This is why the firebaseConfig is not needed.
    //
    // Important: This should only be enabled for local development.
    if (!firebaseApp) {
      // For some reason, the emulators don't work without this.
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      firestore = getFirestore(app);
      firebaseApp = app;
    }
  } else if (!firebaseApp) {
    // In a production environment, we use the real Firebase services.
    // The firebaseConfig is a set of credentials that allows the app to
    // connect to the Firebase project.
    //
    // This is safe to expose to the client, as Firebase has security
    // rules that prevent unauthorized access to data.
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    firestore = getFirestore(app);
    firebaseApp = app;
  }

  return { firebaseApp, auth: auth!, firestore: firestore! };
}
