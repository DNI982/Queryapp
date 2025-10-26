'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * A hook that returns the current user and a loading state.
 *
 * This hook subscribes to the auth state and returns the current user
 * and a loading state. The loading state is true while the auth state
 * is being determined, and false once it has been determined.
 *
 * @returns The current user and a loading state.
 */
export function useUser(): AuthState {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}

interface UserRoleState {
    role: string | null;
    loading: boolean;
    userData: DocumentData | null;
}

export function useUserRole(): UserRoleState {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const [role, setRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userLoading) {
            setLoading(true);
            return;
        }
        if (!user) {
            setRole(null);
            setUserData(null);
            setLoading(false);
            return;
        }

        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setRole(data.role);
            } else {
                setUserData(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userLoading, firestore]);

    return { role, userData, loading };
}
