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

// Log to confirm config is being read correctly
if (typeof window !== 'undefined') {
  console.log("FB", firebaseConfig.projectId, firebaseConfig.authDomain, firebaseConfig.appId?.slice(0,10));
}

// Initialize Firebase for SSR and SSG
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: Storage;

if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
  } else {
      app = getApp();
  }

  firestore = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  try {
    enableIndexedDbPersistence(firestore);
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one.
    } else if (error.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
    }
  }
} else {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    firestore = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
}


export { app, firestore, auth, storage };