'use client';

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBs21YoH_3Fi-u3Bt8MJClq09gEdQLBW9o",
  authDomain: "studio-7575474202-582d8.firebaseapp.com",
  projectId: "studio-7575474202-582d8",
  storageBucket: "studio-7575474202-582d8.firebasestorage.app",
  messagingSenderId: "1057800767082",
  appId: "1:1057800767082:web:4ded3e72275631c6516c13"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
