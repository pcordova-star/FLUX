import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AppUser, UserRole } from '@/lib/types';
import { cookies } from 'next/headers';

export interface UserServerContext {
  uid: string;
  companyId: string;
  role: UserRole;
  appUser: AppUser;
}

/**
 * Retrieves and validates the user's context from a server-side Next.js request.
 * It checks for a Firebase Auth token in cookies, verifies it, and fetches the user's
 * profile from Firestore to determine their role and company.
 * 
 * @param req The NextRequest object.
 * @returns A promise that resolves to the user's context or null if unauthorized.
 * @throws An error if the user is not authorized, inactive, or their profile is missing.
 */
export async function getUserServerContext(req: NextRequest): Promise<UserServerContext | null> {
  const sessionCookie = cookies().get('session')?.value;

  if (!sessionCookie) {
    // This is a common case for unauthenticated users, so we don't throw, just return null.
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { uid } = decodedToken;

    const userDocRef = adminDb.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      throw new Error('Perfil de usuario no encontrado en Firestore.');
    }

    const appUser = userDocSnap.data() as AppUser;

    if (!appUser.isActive) {
      throw new Error('La cuenta de usuario está inactiva.');
    }
    
    if (!appUser.companyId) {
      throw new Error('El usuario no está asociado a una compañía.');
    }

    return {
      uid,
      companyId: appUser.companyId,
      role: appUser.role,
      appUser,
    };
  } catch (error: any) {
    console.warn('Fallo en la validación de la sesión del servidor:', error.message);
    // Throw an error that can be caught by the API route to return a 401/403.
    throw new Error('No autorizado. La sesión es inválida o ha expirado.');
  }
}
