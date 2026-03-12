import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore} from 'firebase/firestore'; // Added initializeFirestore
import { getStorage as getFirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize App Check
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LdiLIIsAAAAAIdzpX9p9wHRiwxLIdQUEbYCkW0r'),
    isTokenAutoRefreshEnabled: true,
  });
}

const auth = getAuth(app);

// FIXED: Initialize Firestore with Long Polling ONCE
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

const storage = getFirebaseStorage(app);

export { app, auth, db, storage };