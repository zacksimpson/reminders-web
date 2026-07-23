import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase web config is not a secret (access is enforced by Firestore
// security rules + Firebase Auth, not by hiding this), but it still comes
// from env vars so each deployment points at its own Firebase project rather
// than whoever built this repo sharing one project's quota. See .env.example.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    "Missing Firebase config. Copy .env.example to .env and fill in your own Firebase project's values."
  );
}

export const app = initializeApp(firebaseConfig);

// reCAPTCHA v3 doesn't verify real traffic from localhost, so dev builds use
// App Check's debug token instead — it still needs to be added once to the
// project's App Check debug token allowlist in the Firebase console.
if (import.meta.env.DEV) {
  (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
if (recaptchaSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);
export const db = getFirestore(app);
