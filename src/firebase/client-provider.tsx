'use client';
import { type PropsWithChildren, useState, useEffect } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

interface FirebaseInstances {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

/**
 * A hook that provides authentication-related functions.
 * This should be used by components that need to interact with Firebase Auth.
 * @returns An object with authentication functions.
 */
export function useAuthActions() {
    const auth = useFirebaseAuth();
    
    const signIn = (email: string, password: string) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = (email: string, password: string) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const signOut = () => {
        return firebaseSignOut(auth);
    };

    return { signIn, signUp, signOut };
}


/**
 * A client-side component that initializes Firebase and provides it to all
 * child components.
 *
 * This component should be used to wrap the root layout of the app.
 *
 * @param props The props for the provider.
 * @returns The provider component.
 */
export function FirebaseClientProvider({ children }: PropsWithChildren) {
  const [instances, setInstances] = useState<FirebaseInstances | null>(null);

  useEffect(() => {
    // Since initializeFirebase is idempotent, we can call it on every render.
    // However, we only want to set the state once.
    if (!instances) {
      setInstances(initializeFirebase());
    }
  }, [instances]);

  // While the Firebase app is initializing, we don't render anything.
  // This prevents components from trying to access Firebase services before
  // they are available.
  if (!instances) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={instances.firebaseApp}
      auth={instances.auth}
      firestore={instances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
