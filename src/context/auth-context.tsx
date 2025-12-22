'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { AppUser, UserRole } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';
import { useFirebase } from './firebase-provider';

export interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  role: UserRole | null;
  companyId: string | null;
  clientId: string | null;
  warehouseIds: string[] | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  role: null,
  companyId: null,
  clientId: null,
  warehouseIds: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setAppUser(null);
    setLoading(false);
  }, [auth]);
  
  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const fetchedAppUser = userDocSnap.data() as AppUser;
          if (fetchedAppUser.isActive) {
            setUser(firebaseUser);
            setAppUser(fetchedAppUser);
          } else {
            // User is not active, log them out
            await handleLogout();
          }
        } else {
          // No appUser document found, log them out
          await handleLogout();
        }
      } else {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore, handleLogout]);

  const login = async (email: string, pass: string) => {
    if (!auth) return;
    await signInWithEmailAndPassword(auth, email, pass);
    // onIdTokenChanged will handle the rest
  };

  const contextValue: AuthContextType = {
    user,
    appUser,
    role: appUser?.role ?? null,
    companyId: appUser?.companyId ?? null,
    clientId: appUser?.clientId ?? null,
    warehouseIds: appUser?.warehouseIds ?? null,
    loading,
    login,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {loading ? <PageSpinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
