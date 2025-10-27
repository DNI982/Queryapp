'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { type FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '@/firebase';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      // Add the current user to the error object.
      // We do this here so we don't have to pass the user around everywhere.
      e.updateContext({
        auth: user
          ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            }
          : null,
      });

      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [user]);

  if (error) {
    // This will be caught by the Next.js error overlay
    throw error;
  }

  return null;
}
