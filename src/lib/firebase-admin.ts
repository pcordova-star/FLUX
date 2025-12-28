
import "server-only";
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let adminApp: App | null = null;

// This function ensures that we only initialize the app once,
// making it safe to use in server-side environments like Next.js API routes or Server Actions.
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }
  
  // --- Dual-mode initialization ---
  
  // 1. Production Mode (App Hosting / GCP Environment with ADC)
  if (process.env.K_SERVICE || process.env.CLOUD_RUN_JOB || process.env.FUNCTION_TARGET || process.env.GOOGLE_CLOUD_PROJECT) {
      console.log("[Firebase Admin] Initializing with Application Default Credentials (ADC).");
      adminApp = initializeApp();
      return adminApp;
  }

  // 2. Local / Studio Preview Mode (using Service Account JSON)
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
      console.log("[Firebase Admin] Initializing with FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable.");
      try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
          // The private key inside the JSON might still have escaped newlines
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
          throw new Error(`Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT: ${e.message}`);
      }
  }

  // 3. If neither method works, fail with a clear error
  throw new Error(
    "Firebase Admin SDK not configured. For App Hosting, ensure the environment is a valid GCP context. For local/Studio development, set the FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable with your service account JSON."
  );
}

// Lazy getters for Firestore and Auth services
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
