// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
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

// Initialize Firebase for SSR
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: Storage = getStorage(app);

export { app, firestore, auth, storage };
