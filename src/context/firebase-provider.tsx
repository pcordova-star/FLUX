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

// Use a global promise to ensure persistence is only enabled once.
declare global {
  var __FLUX_FB_PERSIST_PROMISE__: Promise<void> | undefined;
}

export interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [firebaseContext, setFirebaseContext] = React.useState<IFirebaseContext | null>(null);

  React.useEffect(() => {
    // Initialize Firebase services on the client using singleton getters
    const app = getFirebaseApp();
    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    
    // Set the context value once services are initialized
    setFirebaseContext({ app, auth, firestore });

    // --- Enable Persistence Safely ---
    // This logic ensures persistence is only enabled once per client session.
    if (typeof window !== 'undefined' && !globalThis.__FLUX_FB_PERSIST_PROMISE__) {
      console.log("[FB] Attempting to enable Firestore persistence...");
      globalThis.__FLUX_FB_PERSIST_PROMISE__ = enableIndexedDbPersistence(firestore)
        .then(() => {
          console.log("[FB] Firestore persistence enabled successfully.");
        })
        .catch((error: any) => {
          if (error.code === 'failed-precondition') {
            console.warn("[FB] Firestore persistence failed: multiple tabs open. App will use in-memory cache.");
          } else if (error.code === 'unimplemented') {
            console.warn("[FB] Firestore persistence not available in this browser. App will use in-memory cache.");
          } else {
            console.error("[FB] Firestore persistence error:", error);
          }
        });
    }
      
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
