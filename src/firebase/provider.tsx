'use client';
import {
  createContext,
  useContext,
  type PropsWithChildren,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

/**
 * The context for the Firebase provider.
 *
 * @internal
 */
const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null>(null);

/**
 * A hook that returns the Firebase app, auth, and firestore instances.
 * This hook must be used within a FirebaseProvider.
 *
 * @returns The Firebase app, auth, and firestore instances.
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

/**
 * A hook that returns the Firebase app instance.
 * This hook must be used within a FirebaseProvider.
 *
 * @returns The Firebase app instance.
 */
export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

/**
 * A hook that returns the Firebase auth instance.
 * This hook must be used within a FirebaseProvider.
 *
 * @returns The Firebase auth instance.
 */
export function useAuth() {
  return useFirebase().auth;
}

/**
 * A hook that returns the Firebase firestore instance.
 * This hook must be used within a FirebaseProvider.
 *
 * @returns The Firebase firestore instance.
 */
export function useFirestore() {
  return useFirebase().firestore;
}

/**
 * A provider that makes the Firebase app, auth, and firestore instances
 * available to all child components.
 *
 * This is a server-side component that should be used to wrap the root
 * layout of the app.
 *
 * @param props The props for the provider.
 * @returns The provider component.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: PropsWithChildren<{
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}>) {
  return (
    <FirebaseContext.Provider
      value={{
        firebaseApp,
        auth,
        firestore,
      }}
    >
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}
