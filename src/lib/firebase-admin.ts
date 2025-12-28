import "server-only";
import { initializeApp, getApps, getApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

// This file is designed for server-side use ONLY.
// It uses a singleton pattern to ensure the Firebase Admin app is initialized only once.

let adminApp: App | null = null;

/**
 * Returns a singleton instance of the Firebase Admin App.
 * It relies on Application Default Credentials (ADC) provided by the Google Cloud environment (e.g., App Hosting).
 * This function will NOT work in a local environment unless `gcloud auth application-default login` has been run.
 * For Firebase Studio, which does not provide ADC, this will fail, and seeding operations are disabled.
 */
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // If the app is already initialized (e.g., by another part of the runtime), reuse it.
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  // Initialize a new app. In a Google-managed environment like App Hosting,
  // initializeApp() automatically discovers the project's service account credentials.
  console.log('[FirebaseAdmin] Initializing with Application Default Credentials (ADC).');
  adminApp = initializeApp();
  
  return adminApp;
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
