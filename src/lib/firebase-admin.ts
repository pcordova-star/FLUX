import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// This function ensures that we only initialize the app once,
// making it safe to use in server-side environments like Next.js API routes or Server Actions.
function getAdminApp(): App {
  // If the app is already initialized, return it.
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  
  // Prefer automatic credentials in a Google Cloud environment
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE || process.env.FUNCTION_TARGET) {
    console.log("[Firebase Admin] Initializing with Application Default Credentials.");
    return initializeApp();
  }

  // Fallback to service account JSON from environment variable
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
      try {
        console.log("[Firebase Admin] Initializing with FIREBASE_ADMIN_SERVICE_ACCOUNT env var.");
        const serviceAccount = JSON.parse(serviceAccountJson);
        return initializeApp({ credential: cert(serviceAccount) });
      } catch (error: any) {
          throw new Error(`Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT JSON: ${error.message}`);
      }
  }
  
  // Fallback to individual credential parts from environment variables for local/legacy setup
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    console.log("[Firebase Admin] Initializing with individual credential environment variables.");
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });
  }

  throw new Error(
    "Firebase Admin SDK not configured. Set GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_ADMIN_SERVICE_ACCOUNT, or individual FIREBASE_... env vars."
  );
}

// Lazy getters for Firestore and Auth services
function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

// Export singleton instances for backward compatibility with existing imports.
// The lazy getters ensure the app is initialized before these are accessed.
export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
