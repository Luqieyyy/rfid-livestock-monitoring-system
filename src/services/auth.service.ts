import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AuthUser, UserRole, LoginCredentials, RegisterCredentials } from '@/types/auth.types';

const USERS_COLLECTION = 'users';

export const getUserProfile = async (uid: string): Promise<AuthUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        photoURL: data.photoURL,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const createUserProfile = async (
  user: User,
  role: UserRole,
  displayName?: string
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName,
    role,
    photoURL: user.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const authService = {
  async login(credentials: LoginCredentials, expectedRole: UserRole): Promise<AuthUser> {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const profile = await getUserProfile(user.uid);
    
    if (!profile) {
      // If no profile exists, create one (for existing Firebase Auth users)
      await createUserProfile(user, expectedRole);
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: expectedRole,
        photoURL: user.photoURL,
      };
    }

    // Verify role matches
    if (profile.role !== expectedRole) {
      await signOut(auth);
      throw new Error(`Access denied. This account is registered as ${profile.role}, not ${expectedRole}.`);
    }

    return profile;
  },

  // Register new user - Only buyers can register
  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const { email, password, displayName, role } = credentials;
    
    // Only allow buyer registration
    if (role !== 'buyer') {
      throw new Error('Only buyers can register. Admin accounts must be created by existing admins.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(user, role, displayName);

    return {
      uid: user.uid,
      email: user.email,
      displayName,
      role,
      photoURL: user.photoURL,
    };
  },

  // Sign out
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        callback(profile);
      } else {
        callback(null);
      }
    });
  },

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
