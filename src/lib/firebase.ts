import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  enableIndexedDbPersistence,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId 
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper for signing in with Google (prefer popup as per environment requirements)
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase signInWithPopup error:', error);
    throw error;
  }
}

// Helper for signing out
export async function logOut() {
  return signOut(auth);
}

// Helper to record every submission with server timestamp in Firestore
export interface SubmissionLog {
  id?: string;
  type: 'CREATE_PROJECT' | 'UPDATE_PROGRESS' | 'UPDATE_PROJECT' | 'DELETE_PROJECT' | 'MANAGE_AGENCY' | 'INITIALIZE_SAMPLE_DATA' | 'GEMINI_ASSISTANT_QUERY' | 'CHATBOT_QUERY' | 'EXPORT_CSV';
  projectId?: string;
  projectTitle?: string;
  userId?: string;
  userEmail?: string | null;
  userName?: string | null;
  timestamp: any; // Firestore serverTimestamp or Date
  details?: any;
}

export async function logSubmission(submission: Omit<SubmissionLog, 'timestamp'>): Promise<string | undefined> {
  try {
    const submissionsCol = collection(db, 'submissions');
    const user = auth.currentUser;
    const docRef = await addDoc(submissionsCol, {
      ...submission,
      userId: submission.userId || user?.uid || 'anonymous',
      userEmail: submission.userEmail !== undefined ? submission.userEmail : (user?.email || null),
      userName: submission.userName !== undefined ? submission.userName : (user?.displayName || 'Pengguna Sistem'),
      timestamp: serverTimestamp(),
      createdAtIso: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to log submission to Firestore:', err);
    // Non-blocking but logged
    return undefined;
  }
}

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onAuthStateChanged
};
export type { User };
