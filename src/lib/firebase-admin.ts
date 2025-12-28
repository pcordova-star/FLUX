
import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

// This function enforces a single, explicit initialization path using a service account JSON.
// It completely avoids attempting to use Application Default Credentials (ADC), which prevents
// metadata server errors in environments like Firebase Studio Preview.
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // There is only one way to init: via the service account JSON.
  const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!serviceAccountString) {
    throw new Error(
      "Firebase Admin SDK not configured. The FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable is required."
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    
    // The private key inside the JSON might have escaped newlines ('\\n')
    // which need to be converted to actual newlines ('\n').
    const privateKey = serviceAccount.private_key?.replace(/\\n/g, '\n');

    adminApp = initializeApp({
        credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey,
        })
    });
    
    return adminApp;

  } catch (e: any) {
      throw new Error(`Failed to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT: ${e.message}`);
  }
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
