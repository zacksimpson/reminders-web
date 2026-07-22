import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public web config — safe to embed in client code (not a secret; access is
// enforced by Firestore security rules + Firebase Auth, not by hiding this).
const firebaseConfig = {
  apiKey: "AIzaSyBHpynggk2UlUeBGVCJaw-yaXEzzz6payY",
  authDomain: "reminders-web-zs2026.firebaseapp.com",
  projectId: "reminders-web-zs2026",
  storageBucket: "reminders-web-zs2026.firebasestorage.app",
  messagingSenderId: "1055613872869",
  appId: "1:1055613872869:web:5d1911c7d04e6819e5020c",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
