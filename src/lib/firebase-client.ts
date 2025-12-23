// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, type Storage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBs21YoH_3Fi-u3Bt8MJClq09gEdQLBW9o",
  authDomain: "studio-7575474202-582d8.firebaseapp.com",
  projectId: "studio-7575474202-582d8",
  storageBucket: "studio-7575474202-582d8.appspot.com",
  messagingSenderId: "1057800767082",
  appId: "1:1057800767082:web:4ded3e72275631c6516c13"
};

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

firestore = getFirestore(app);
auth = getAuth(app);
storage = getStorage(app);

// Enable persistence
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

export { app, firestore, auth, storage };
