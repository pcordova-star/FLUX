import "server-only";
import { initializeApp, getApps, getApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

/**
 * Initializes the Firebase Admin SDK, relying on Application Default Credentials (ADC).
 * This pattern is required for environments like Firebase App Hosting and Cloud Run
 * where credentials are automatically provided.
 * It prevents re-initialization on hot reloads.
 */
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // In Google Cloud environments (like App Hosting), the SDK will automatically
  // find the service account credentials. No manual configuration is needed.
  if (!getApps().length) {
    console.log("[FirebaseAdmin] Initializing with Application Default Credentials.");
    adminApp = initializeApp();
  } else {
    console.log("[FirebaseAdmin] Using existing app instance.");
    adminApp = getApp();
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
