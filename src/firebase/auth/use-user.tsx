'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';

interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * A hook that returns the current user and a loading state.
 *
 * This hook subscribes to the auth state and returns the current user
 * and a loading state. The loading state is true while the auth state
s * is being determined, and false once it has been determined.
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
