'use client';

import { app, auth, firestore } from '@/lib/firebase-client';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import * as React from 'react';
import { AuthProvider, useAuth } from '@/context/auth-context';

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
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null; // O un componente de carga
  }

  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
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
