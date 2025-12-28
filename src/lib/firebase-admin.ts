import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';

let db: Firestore;
let auth: Auth;

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
    return app;
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    // Lanza el error para que sea visible en el servidor y no falle silenciosamente.
    throw new Error('Failed to initialize Firebase Admin SDK. Check server environment variables.');
  }
}

function getAdminDb(): Firestore {
  if (!db) {
    initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}

function getAdminAuth(): Auth {
  if (!auth) {
    initializeAdminApp();
    auth = admin.auth();
  }
  return auth;
}

export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
