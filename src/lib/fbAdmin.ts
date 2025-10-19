import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Handle escaped newlines if set as a single-line env
if (privateKey?.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

if (!getApps().length) {
  if (clientEmail && privateKey && projectId) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    // fallback for local dev if you have ADC configured (gcloud auth application-default login)
    initializeApp({ credential: applicationDefault() });
  }
}

export const adminDb = getFirestore();
