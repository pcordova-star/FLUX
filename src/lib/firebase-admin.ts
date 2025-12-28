
import "server-only";
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
  
  // Force initialization with explicit service account credentials.
  // This is the required method for environments like Firebase Studio/Workstations
  // that do not have access to the GCP metadata server for ADC.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin credentials. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
      );
  }
  
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error("Invalid FIREBASE_PRIVATE_KEY: PEM format must include '-----BEGIN PRIVATE KEY-----'.");
  }
  if (!privateKey.includes("-----END PRIVATE KEY-----")) {
      throw new Error("Invalid FIREBASE_PRIVATE_KEY: PEM format must include '-----END PRIVATE KEY-----'.");
  }

  console.log('[Firebase Admin] Initializing with explicit service account credentials.');
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
