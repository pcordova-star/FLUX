// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore, type Firestore } from "firebase/firestore";
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

// --- Lazy Getters for Firebase Services ---

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: Storage;

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  
  if (!firebaseConfig.projectId) {
      console.warn("[FirebaseDiag] ⚠️ Firebase config values are undefined. App cannot be initialized.");
  }
  
  app = initializeApp(firebaseConfig);
  console.log("[FirebaseDiag] Client App Initialized:", { projectId: app.options.projectId });
  return app;
}


function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());

    // Enable persistence in production environments, only on the client
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        enableIndexedDbPersistence(firestore)
          .then(() => console.log("[FirebaseDiag] Firestore persistence enabled."))
          .catch((error: any) => {
              if (error.code === 'failed-precondition') {
                  console.warn("[FirebaseDiag] Firestore persistence failed: multiple tabs open.");
              } else if (error.code === 'unimplemented') {
                  console.warn("[FirebaseDiag] Firestore persistence not available in this browser.");
              }
          });
    }
  }
  return firestore;
}

function getFirebaseStorage(): Storage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}

export { 
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage
};
