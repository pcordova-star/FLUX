'use client';

import { 
  getFirebaseApp, 
  getFirebaseAuth, 
  getFirebaseFirestore 
} from '@/lib/firebase-client';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
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
  const [firebaseContext, setFirebaseContext] = React.useState<IFirebaseContext | null>(null);

  React.useEffect(() => {
    // Initialize Firebase services on the client
    const app = getFirebaseApp();
    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    
    // Set the context value once services are initialized
    setFirebaseContext({ app, auth, firestore });

    // Enable persistence once, on the client, after Firestore is initialized
    enableIndexedDbPersistence(firestore)
      .then(() => console.log("[FirebaseDiag] Firestore persistence enabled."))
      .catch((error: any) => {
          if (error.code === 'failed-precondition') {
              console.warn("[FirebaseDiag] Firestore persistence failed: multiple tabs open.");
          } else if (error.code === 'unimplemented') {
              console.warn("[FirebaseDiag] Firestore persistence not available in this browser.");
          }
      });
      
  }, []); // Empty dependency array ensures this runs only once on component mount
  
  if (!firebaseContext) {
    // Render nothing until Firebase is initialized on the client
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
