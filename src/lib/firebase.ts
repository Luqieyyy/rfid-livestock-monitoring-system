import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';
import { firebaseConfig } from '@/config/firebase.config';

let app: FirebaseApp | null = null;
let firebaseDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let firebaseRtdb: Database | null = null;

const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;

export const getMissingFirebaseConfigKeys = () => {
  return requiredKeys.filter((key) => !firebaseConfig[key]);
};

export const isFirebaseConfigured = () => getMissingFirebaseConfigKeys().length === 0;

// Validate Firebase configuration — only throws on client, silent on server/build
const validateConfig = () => {
  const missingKeys = getMissingFirebaseConfigKeys();
  if (missingKeys.length === 0) return;
  if (typeof window === 'undefined') {
    // SSR / build time — skip silently, app initializes properly at runtime
    return;
  }
  throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}`);
};

const ensureFirebaseApp = () => {
  if (!isFirebaseConfigured()) {
    validateConfig();
    return null; // SSR/build — return null, Firebase not needed server-side
  }

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }

  return app;
}

export const getFirebaseApp = () => ensureFirebaseApp();

export const getFirebaseDb = () => {
  const app = ensureFirebaseApp();
  if (!app) return null as unknown as Firestore;
  if (!firebaseDb) firebaseDb = getFirestore(app);
  return firebaseDb;
};

export const getFirebaseAuth = () => {
  const app = ensureFirebaseApp();
  if (!app) return null as unknown as Auth;
  if (!firebaseAuth) firebaseAuth = getAuth(app);
  return firebaseAuth;
};

export const getFirebaseStorage = () => {
  const app = ensureFirebaseApp();
  if (!app) return null as unknown as FirebaseStorage;
  if (!firebaseStorage) firebaseStorage = getStorage(app);
  return firebaseStorage;
};

export const getFirebaseRtdb = () => {
  const app = ensureFirebaseApp();
  if (!app) return null as unknown as Database;
  if (!firebaseRtdb) firebaseRtdb = getDatabase(app);
  return firebaseRtdb;
};

// Module-level exports — safe now that ensureFirebaseApp returns null during build
// (no throw during SSR/prerender; real init happens client-side at runtime)
export const db      = getFirebaseDb();
export const auth    = getFirebaseAuth();
export const storage = getFirebaseStorage();
export const rtdb    = getFirebaseRtdb();
