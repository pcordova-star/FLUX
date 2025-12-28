import "server-only";
import { initializeApp, getApps, getApp, type App, cert } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

const isMetadataError = (error: any): boolean => {
  const errorMessage = String(error?.message || '').toLowerCase();
  return (
    errorMessage.includes('metadata') ||
    errorMessage.includes('could not refresh access token') ||
    errorMessage.includes('enotfound metadata') ||
    errorMessage.includes('no such host')
  );
};

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  try {
    // Modo 1: Intentar inicialización automática (para App Hosting, Cloud Run, etc.)
    console.log('[FirebaseAdmin] Attempting ADC initialization...');
    adminApp = initializeApp();
    console.log('[FirebaseAdmin] ADC initialization successful.');
  } catch (error) {
    console.warn('[FirebaseAdmin] ADC initialization failed:', error);
    if (isMetadataError(error)) {
      // Modo 2: Fallback a cuenta de servicio explícita (para Studio, local)
      console.log('[FirebaseAdmin] ADC failed. Falling back to FIREBASE_ADMIN_SERVICE_ACCOUNT env var.');
      const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
      if (!serviceAccountJson) {
        throw new Error(
          'FIREBASE_ADMIN_SERVICE_ACCOUNT is not set. This is required for local/studio development environments where ADC is not available.'
        );
      }
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        // Normalizar la clave privada por si viene escapada
        const privateKey = serviceAccount.private_key.includes('\\n')
          ? serviceAccount.private_key.replace(/\\n/g, '\n')
          : serviceAccount.private_key;

        adminApp = initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: privateKey,
          }),
        });
        console.log('[FirebaseAdmin] Service Account initialization successful.');
      } catch (saError) {
        console.error('[FirebaseAdmin] Failed to initialize with Service Account JSON:', saError);
        throw new Error('Failed to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT. Check if the JSON is valid.');
      }
    } else {
      // Si el error inicial no es de metadatos, es un problema diferente y debe lanzarse.
      throw error;
    }
  }

  return adminApp;
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
