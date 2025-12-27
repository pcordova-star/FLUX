'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import PageSpinner from '@/components/page-spinner';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is confirmed
    }

    if (user) {
      if (typeof window !== 'undefined') {
        const onboardingComplete = localStorage.getItem('onboardingComplete');
        if (onboardingComplete === 'true') {
          router.replace('/dashboard');
        } else {
          router.replace('/first-run');
        }
      }
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return <PageSpinner />;
}
