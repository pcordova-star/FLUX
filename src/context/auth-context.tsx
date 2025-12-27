'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onIdTokenChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { AppUser, UserRole } from '@/lib/types';
import PageSpinner from '@/components/page-spinner';
import { useFirebase } from './firebase-provider';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    if (!auth) return;
    console.log('[AuthDiag] Logging out user.');
    await signOut(auth);
    setUser(null);
    setAppUser(null);
    setLoading(false);
  }, [auth]);
  
  useEffect(() => {
    if (!auth || !firestore) {
      if (!loading) setLoading(true); // Ensure loading is true if firebase is not ready
      return;
    };

    console.log('[AuthDiag] Subscribing to onIdTokenChanged.');
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        try {
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const fetchedAppUser = userDocSnap.data() as AppUser;
              console.log(`[AuthDiag] AppUser loaded:`, { role: fetchedAppUser.role, companyId: fetchedAppUser.companyId, isActive: fetchedAppUser.isActive });
              if (fetchedAppUser.isActive) {
                setUser(firebaseUser);
                setAppUser(fetchedAppUser);
                 // Onboarding check
                if (typeof window !== 'undefined') {
                    const onboardingComplete = localStorage.getItem('onboardingComplete');
                    if (onboardingComplete !== 'true') {
                        // Forcing redirect to first-run page.
                        // Check if we are not already there to avoid loops.
                        if (window.location.pathname !== '/first-run') {
                            router.replace('/first-run');
                        }
                    }
                }

              } else {
                console.warn(`[AuthDiag] User ${firebaseUser.uid} is inactive. Forcing logout.`);
                await handleLogout();
              }
            } else {
              console.warn(`[AuthDiag] AppUser document not found for UID ${firebaseUser.uid}. Creating it...`);
              const newUser: Omit<AppUser, 'createdAt'> = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email,
                role: 'admin',
                companyId: 'default', // Default company for new users
                isActive: true,
              };

              await setDoc(userDocRef, {
                ...newUser,
                createdAt: serverTimestamp()
              });

              console.log("[AuthDiag] AppUser created successfully.");
              
              const newUserSnap = await getDoc(userDocRef);
              if (newUserSnap.exists()) {
                const createdAppUser = newUserSnap.data() as AppUser;
                setAppUser(createdAppUser);
                setUser(firebaseUser);
                 if (typeof window !== 'undefined' && window.location.pathname !== '/first-run') {
                    router.replace('/first-run');
                 }
              } else {
                 throw new Error("Failed to fetch newly created user profile.");
              }
            }
        } catch (error) {
            console.error("[AuthDiag] Fatal error during user profile handling:", error);
            await handleLogout();
        }

      } else {
        console.log('[AuthDiag] Token changed. User is null.');
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('[AuthDiag] Unsubscribing from onIdTokenChanged.');
      unsubscribe();
    };
  }, [auth, firestore, handleLogout, router]);

  const login = async (email: string, pass: string) => {
    if (!auth) {
      console.error('[AuthDiag] Auth service not available for login.');
      throw new Error("El servicio de autenticación no está disponible.");
    };
    console.log(`[AuthDiag] Attempting login for ${email}`);
    await signInWithEmailAndPassword(auth, email, pass);
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
