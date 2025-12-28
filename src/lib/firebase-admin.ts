
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
  
  // In a Google Cloud environment (like App Hosting or Firebase Studio),
  // initializeApp() automatically uses Application Default Credentials.
  console.log("[Firebase Admin] Initializing with Application Default Credentials.");
  return initializeApp();
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
