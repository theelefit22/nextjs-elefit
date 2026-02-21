import {
  initializeApp,
  getApps,
  FirebaseApp,
} from "firebase/app";
import {
  getAuth,
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  AuthProvider,
  confirmPasswordReset,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  DocumentData,
  QueryConstraint,
  writeBatch,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getDatabase, Database, ref as dbRef, set, get } from "firebase/database";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if config is available
let app: FirebaseApp | undefined;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let database: any;
let analytics: any;

const isConfigValid = !!firebaseConfig.apiKey;

if (isConfigValid) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    database = getDatabase(app);

    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      analytics = getAnalytics(app);
    }
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    database = getDatabase(app);
  }
} else {
  console.warn("Firebase configuration is missing. Skipping initialization.");
  // Mock objects or handle as needed
}

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

/**
 * Sign up user with email and password
 */
export const signupUser = async (
  email: string,
  password: string,
  userType: "customer" | "expert" | "admin",
  firstName: string,
  lastName: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      uid: user.uid,
      userType,
      firstName,
      lastName,
      createdAt: new Date(),
      profileImageUrl: null,
      phoneVerified: false,
      phone: null,
    });

    return user;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Signup failed"
    );
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Login failed"
    );
  }
};

/**
 * Sign out user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Logout failed"
    );
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Password reset failed"
    );
  }
};

/**
 * Confirm password reset
 */
export const confirmPasswordResetWithCode = async (
  code: string,
  newPassword: string
) => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Password reset confirmation failed"
    );
  }
};

/**
 * Start phone verification
 */
export const startPhoneVerification = async (
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
) => {
  try {
    const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    return result;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Phone verification initiation failed"
    );
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthStateChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================
// USER PROFILE FUNCTIONS
// ============================================================

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch user profile"
    );
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid: string, updates: any) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update user profile"
    );
  }
};

/**
 * Get user type
 */
export const getUserType = async (uid: string) => {
  try {
    const profile = await getUserProfile(uid);
    return profile?.userType || null;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to get user type"
    );
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (uid: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    // Delete user document from Firestore
    await deleteDoc(doc(db, "users", uid));

    // Delete user authentication
    await user.delete();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete user account"
    );
  }
};

// ============================================================
// EXPERT FUNCTIONS
// ============================================================

/**
 * Get expert profile
 */
export const getExpertProfile = async (uid: string) => {
  try {
    const docSnap = await getDoc(doc(db, "experts", uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch expert profile"
    );
  }
};

/**
 * Update expert profile
 */
export const updateExpertProfile = async (uid: string, updates: any) => {
  try {
    const expertRef = doc(db, "experts", uid);
    await updateDoc(expertRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to update expert profile"
    );
  }
};

/**
 * Search experts by filters
 */
export const searchExperts = async (filters: {
  expertise?: string;
  minRating?: number;
  available?: boolean;
} = {}) => {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.expertise) {
      constraints.push(where("expertise", "==", filters.expertise));
    }

    if (filters.minRating) {
      constraints.push(where("rating", ">=", filters.minRating));
    }

    if (filters.available) {
      constraints.push(where("available", "==", true));
    }

    const q = query(collection(db, "experts"), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to search experts"
    );
  }
};

/**
 * Verify expert
 */
export const verifyExpert = async (uid: string) => {
  try {
    await updateExpertProfile(uid, {
      verified: true,
      verifiedAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to verify expert"
    );
  }
};

// ============================================================
// STORAGE FUNCTIONS
// ============================================================

/**
 * Upload file to Firebase Storage
 */
export const uploadFile = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    const snapshot = await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "File upload failed"
    );
  }
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFile = async (path: string) => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "File deletion failed"
    );
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (
  uid: string,
  file: File
): Promise<string> => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    const downloadUrl = await uploadFile(file, `profiles/${uid}/${fileName}`);
    await updateUserProfile(uid, { profileImageUrl: downloadUrl });
    return downloadUrl;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Profile image upload failed"
    );
  }
};

// ============================================================
// REALTIME DATABASE FUNCTIONS
// ============================================================

/**
 * Save data to Realtime Database
 */
export const saveRealtimeData = async (path: string, data: any) => {
  try {
    await set(dbRef(database, path), data);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to save realtime data"
    );
  }
};

/**
 * Get data from Realtime Database
 */
export const getRealtimeData = async (path: string) => {
  try {
    const snapshot = await get(dbRef(database, path));
    return snapshot.val();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to get realtime data"
    );
  }
};

// ============================================================
// AI COACH FUNCTIONS
// ============================================================

/**
 * Save AI Coach data
 */
export const saveAiCoachData = async (uid: string, data: any) => {
  try {
    const docRef = doc(db, "users", uid, "aiCoachData", "current");
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to save AI coach data"
    );
  }
};

/**
 * Get AI Coach data
 */
export const getAiCoachData = async (uid: string) => {
  try {
    const docSnap = await getDoc(doc(db, "users", uid, "aiCoachData", "current"));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch AI coach data"
    );
  }
};

/**
 * Save AI Coach history
 */
export const saveAiCoachHistory = async (uid: string, historyData: any) => {
  try {
    const timestamp = new Date().getTime();
    await setDoc(doc(db, "users", uid, "aiCoachHistory", String(timestamp)), {
      ...historyData,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to save history"
    );
  }
};

/**
 * Get AI Coach history
 */
export const getAiCoachHistory = async (uid: string) => {
  try {
    const q = query(
      collection(db, "users", uid, "aiCoachHistory")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch history"
    );
  }
};

// ============================================================
// COMMUNITY FUNCTIONS
// ============================================================

/**
 * Create community post
 */
export const createCommunityPost = async (uid: string, postData: any) => {
  try {
    const docRef = doc(collection(db, "community"));
    await setDoc(docRef, {
      ...postData,
      authorId: uid,
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      id: docRef.id,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create post"
    );
  }
};

/**
 * Get community posts
 */
export const getCommunityPosts = async (limit: number = 20) => {
  try {
    const q = query(collection(db, "community"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch posts"
    );
  }
};

/**
 * Like community post
 */
export const likeCommunityPost = async (postId: string, uid: string) => {
  try {
    const postRef = doc(db, "community", postId);
    const docSnap = await getDoc(postRef);
    const likesList = docSnap.data()?.likes || [];
    if (!likesList.includes(uid)) {
      likesList.push(uid);
      await updateDoc(postRef, { likes: likesList });
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to like post"
    );
  }
};

// ============================================================
// BOOKING FUNCTIONS
// ============================================================

/**
 * Create booking
 */
export const createBooking = async (bookingData: any) => {
  try {
    const docRef = doc(collection(db, "bookings"));
    await setDoc(docRef, {
      ...bookingData,
      createdAt: new Date(),
      status: "pending",
      id: docRef.id,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create booking"
    );
  }
};

/**
 * Get bookings for user
 */
export const getUserBookings = async (uid: string) => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("customerId", "==", uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch bookings"
    );
  }
};

/**
 * Update booking
 */
export const updateBooking = async (bookingId: string, updates: any) => {
  try {
    await updateDoc(doc(db, "bookings", bookingId), {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update booking"
    );
  }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Batch write operations
 */
export const batchWrite = async (operations: Array<{
  type: "set" | "update" | "delete";
  collection: string;
  docId: string;
  data?: any;
}>) => {
  try {
    const batch = writeBatch(db);

    operations.forEach((op) => {
      const docRef = doc(db, op.collection, op.docId);
      if (op.type === "set") {
        batch.set(docRef, op.data);
      } else if (op.type === "update") {
        batch.update(docRef, op.data);
      } else if (op.type === "delete") {
        batch.delete(docRef);
      }
    });

    await batch.commit();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Batch write failed"
    );
  }
};

// Export Firebase instances
export { auth, db, storage, database, app };
