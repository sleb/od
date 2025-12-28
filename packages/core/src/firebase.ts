import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.OVERDRIP_FIREBASE_API_KEY,
  authDomain: process.env.OVERDRIP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.OVERDRIP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.OVERDRIP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.OVERDRIP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.OVERDRIP_FIREBASE_APP_ID,
  measurementId: process.env.OVERDRIP_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

if (process.env.NODE_ENV !== "production") {
  console.log("NODE_ENV != 'production', conneting emulators...");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
  connectFunctionsEmulator(functions, "localhost", 5001);
}

const getCreateCustomTokenUrl = () => {
  const url = process.env.OVERDRIP_FIREBASE_CREATE_CUSTOM_TOKEN_URL;
  if (!url) {
    throw new Error(
      `Environment variable OVERDRIP_FIREBASE_CREATE_CUSTOM_TOKEN_URL is not set`,
    );
  }
  return url;
};

export const CREATE_CUSTOM_TOKEN_URL = getCreateCustomTokenUrl();
