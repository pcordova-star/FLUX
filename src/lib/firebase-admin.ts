import "server-only";
import { initializeApp, getApps, getApp, type App, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  // Prioritize explicit service account for dev/studio environments
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    console.log('[FirebaseAdmin] Initializing with explicit service account (FIREBASE_ADMIN_SERVICE_ACCOUNT).');
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      // Normalize the private key if it's escaped
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
      return adminApp;
    } catch (e: any) {
      console.error('[FirebaseAdmin] Failed to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT.', e);
      throw new Error(`Failed to initialize with Service Account: ${e.message}`);
    }
  }

  // Fallback to Application Default Credentials for App Hosting environments
  console.log('[FirebaseAdmin] Initializing with Application Default Credentials (ADC).');
  try {
     adminApp = initializeApp({
        credential: applicationDefault(),
     });
     return adminApp;
  } catch (e: any) {
    console.error('[FirebaseAdmin] ADC Initialization failed.', e);
    throw new Error(`Failed to initialize with ADC. Ensure you are in a supported Google Cloud environment. Error: ${e.message}`);
  }
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
