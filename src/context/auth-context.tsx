'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import PageSpinner from '@/components/page-spinner';

export interface AuthContextType {
  user: User | null;
  claims: { [key: string]: any } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  claims: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<AuthContextType['claims']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          const tokenResult = await user.getIdTokenResult();
          setClaims(tokenResult.claims);
        } catch (error) {
          console.error('Error getting token claims:', error);
          setClaims(null);
        }
      } else {
        setUser(null);
        setClaims(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, claims, loading }}>
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
