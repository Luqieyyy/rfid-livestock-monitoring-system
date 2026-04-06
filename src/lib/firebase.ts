import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '@/config/firebase.config';

let app: FirebaseApp | null = null;
let firebaseDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;

const requiredKeys = ['apiKey', 'authDomain', 'projectId'] as const;

export const getMissingFirebaseConfigKeys = () => {
  return requiredKeys.filter((key) => !firebaseConfig[key]);
};

export const isFirebaseConfigured = () => getMissingFirebaseConfigKeys().length === 0;

// Validate Firebase configuration
const validateConfig = () => {
  const missingKeys = getMissingFirebaseConfigKeys();
  
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase config: ${missingKeys.join(', ')}`);
  }
};

const ensureFirebaseApp = () => {
  if (!isFirebaseConfigured()) {
    validateConfig();
  }

  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }

  return app;
}

export const getFirebaseApp = () => ensureFirebaseApp();

export const getFirebaseDb = () => {
  if (!firebaseDb) {
    firebaseDb = getFirestore(ensureFirebaseApp());
  }
  return firebaseDb;
};

export const getFirebaseAuth = () => {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(ensureFirebaseApp());
  }
  return firebaseAuth;
};

export const getFirebaseStorage = () => {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(ensureFirebaseApp());
  }
  return firebaseStorage;
};

const createLazyProxy = <T extends object>(resolver: () => T): T => {
  return new Proxy({} as T, {
    get: (_, property) => Reflect.get(resolver(), property),
    has: (_, property) => property in resolver(),
    ownKeys: () => Reflect.ownKeys(resolver()),
    getOwnPropertyDescriptor: (_, property) => Object.getOwnPropertyDescriptor(resolver(), property),
  });
};

export const db = createLazyProxy(getFirebaseDb);
export const auth = createLazyProxy(getFirebaseAuth);
export const storage = createLazyProxy(getFirebaseStorage);
