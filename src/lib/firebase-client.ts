// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore, type Firestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
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

// Log to confirm config is being read correctly
if (typeof window !== 'undefined') {
  // This block will run only once in the browser.
  if (!(window as any).__firebaseConfigLogged) {
    console.log(
      "[FirebaseDiag] Config:",
      {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        appId: firebaseConfig.appId?.slice(0,10) + '...',
      }
    );

    if (!firebaseConfig.projectId || !firebaseConfig.authDomain || !firebaseConfig.appId) {
        console.warn("[FirebaseDiag] ⚠️ One or more Firebase config values are undefined. Check your .env file.");
    }
    
    (window as any).__firebaseConfigLogged = true;
  }
}

// Initialize Firebase for SSR and SSG
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: Storage;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize services
auth = getAuth(app);
storage = getStorage(app);

// Firestore initialization with DEV mitigation
if (process.env.NODE_ENV === 'production') {
    firestore = getFirestore(app);
    // Enable persistence in production
    if (typeof window !== 'undefined') {
        try {
            if (!(window as any).__firestorePersistenceEnabled) {
                enableIndexedDbPersistence(firestore)
                    .then(() => console.log("[FirebaseDiag] Firestore persistence enabled for production."))
                    .catch((error: any) => {
                        if (error.code === 'failed-precondition') {
                            console.warn("[FirebaseDiag] Firestore persistence failed: multiple tabs open.");
                        } else if (error.code === 'unimplemented') {
                            console.warn("[FirebaseDiag] Firestore persistence not available in this browser.");
                        }
                    });
                (window as any).__firestorePersistenceEnabled = true;
            }
        } catch (error: any) {
            console.error("[FirebaseDiag] Error enabling persistence", error);
        }
    }
} else {
    // DEV mitigation for Firestore INTERNAL ASSERTION ca9 under HMR
    firestore = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalForceLongPolling: true,
    });
    console.log("[FirebaseDiag] Firestore initialized with in-memory cache for DEV.");
}

export { app, firestore, auth, storage };
