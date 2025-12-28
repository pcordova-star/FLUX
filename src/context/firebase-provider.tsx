'use client';

import { 
  getFirebaseApp, 
  getFirebaseAuth, 
  getFirebaseFirestore 
} from '@/lib/firebase-client';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import * as React from 'react';
import { AuthProvider } from '@/context/auth-context';

interface IFirebaseContext {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = React.createContext<IFirebaseContext | null>(null);

export interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  // We use useState to hold the context value to ensure it's only created on the client
  const [firebaseContext, setFirebaseContext] = React.useState<IFirebaseContext | null>(null);

  React.useEffect(() => {
    // This effect runs only on the client side
    const app = getFirebaseApp();
    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    
    setFirebaseContext({ app, auth, firestore });
  }, []);
  
  // If the context hasn't been created yet (i.e., on server or initial client render),
  // we can return null or a loading spinner. Returning children would cause them
  // to attempt to use a null context.
  if (!firebaseContext) {
    return null;
  }

  return (
    <FirebaseContext.Provider value={firebaseContext}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = React.useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
