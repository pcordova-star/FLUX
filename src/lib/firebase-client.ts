// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type Storage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- Singleton Getters for Firebase Services ---

// Extend the global type to avoid TypeScript errors
declare global {
  var __FLUX_FB_APP__: FirebaseApp | undefined;
  var __FLUX_FB_AUTH__: Auth | undefined;
  var __FLUX_FB_DB__: Firestore | undefined;
  var __FLUX_FB_STORAGE__: Storage | undefined;
}

function getFirebaseApp(): FirebaseApp {
  if (globalThis.__FLUX_FB_APP__) {
    return globalThis.__FLUX_FB_APP__;
  }

  if (getApps().length > 0) {
    globalThis.__FLUX_FB_APP__ = getApps()[0];
    return globalThis.__FLUX_FB_APP__!;
  }
  
  if (!firebaseConfig.projectId) {
      console.warn("[FirebaseDiag] ⚠️ Firebase config values are undefined. App cannot be initialized.");
  }
  
  const app = initializeApp(firebaseConfig);
  console.log("[FB] init app once", { projectId: app.options.projectId });
  globalThis.__FLUX_FB_APP__ = app;
  return app;
}


function getFirebaseAuth(): Auth {
  if (globalThis.__FLUX_FB_AUTH__) {
    return globalThis.__FLUX_FB_AUTH__;
  }
  const auth = getAuth(getFirebaseApp());
  globalThis.__FLUX_FB_AUTH__ = auth;
  return auth;
}

function getFirebaseFirestore(): Firestore {
  if (globalThis.__FLUX_FB_DB__) {
    return globalThis.__FLUX_FB_DB__;
  }
  const db = getFirestore(getFirebaseApp());
  console.log("[FB] init db once");
  globalThis.__FLUX_FB_DB__ = db;
  return db;
}

function getFirebaseStorage(): Storage {
  if (globalThis.__FLUX_FB_STORAGE__) {
    return globalThis.__FLUX_FB_STORAGE__;
  }
  const storage = getStorage(getFirebaseApp());
  globalThis.__FLUX_FB_STORAGE__ = storage;
  return storage;
}

export { 
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage
};
