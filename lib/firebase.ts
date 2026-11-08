import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getDatabase, ref, set, get, child } from "firebase/database";

const FIREBASE_REST_BASE = "https://gnani-e666b-default-rtdb.europe-west1.firebasedatabase.app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gnani-e666b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gnani-e666b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || FIREBASE_REST_BASE,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("your_") &&
  firebaseConfig.projectId
);

// Initialize Firebase SDK if client API key is provided
let app: any = null;
let auth: any = null;
let database: any = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
  } catch (err) {
    console.warn("Firebase client init warning:", err);
  }
}

export { app, auth, database };

export interface UserCompanySetup {
  companyName: string;
  companyType: string;
  forwardingNumber: string;
  voice: string;
  language: string;
  completed: boolean;
  updatedAt: string;
}

const LOCAL_USERS_KEY = "vaani_users_mock";
const LOCAL_CURRENT_USER_KEY = "vaani_current_user_mock";
const LOCAL_SETUP_KEY = "vaani_setup_mock";

/**
 * Direct Realtime Database REST Sync to https://gnani-e666b-default-rtdb.europe-west1.firebasedatabase.app
 */
export async function syncRealtimeDb(subPath: string, data: any): Promise<boolean> {
  try {
    const cleanPath = subPath.startsWith("/") ? subPath.slice(1) : subPath;
    const url = `${FIREBASE_REST_BASE}/${cleanPath}.json`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn("Firebase Realtime DB sync warning:", err);
    return false;
  }
}

/**
 * Fetch from Firebase Realtime Database via REST
 */
export async function fetchRealtimeDb(subPath: string): Promise<any> {
  try {
    const cleanPath = subPath.startsWith("/") ? subPath.slice(1) : subPath;
    const url = `${FIREBASE_REST_BASE}/${cleanPath}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Firebase fetch warning:", err);
    return null;
  }
}

/**
 * Sign up a new user with Email and Password
 */
export async function signUpUser(email: string, pass: string): Promise<{ user: any; isNew: boolean }> {
  if (auth && isFirebaseConfigured) {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await syncRealtimeDb(`users/${res.user.uid}/profile`, {
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
      });
      return { user: res.user, isNew: true };
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        throw new Error("USER_EXISTS");
      }
      throw err;
    }
  }

  // Local simulated fallback
  const rawUsers = typeof window !== "undefined" ? localStorage.getItem(LOCAL_USERS_KEY) : null;
  const users = rawUsers ? JSON.parse(rawUsers) : {};

  if (users[email.toLowerCase()]) {
    throw new Error("USER_EXISTS");
  }

  const newUser = {
    uid: `user_${Date.now()}`,
    email: email.toLowerCase(),
    password: pass,
    createdAt: new Date().toISOString(),
  };

  users[email.toLowerCase()] = newUser;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(newUser));

  // Sync to Firebase Realtime DB
  syncRealtimeDb(`users/${newUser.uid}/profile`, {
    email: email.toLowerCase(),
    createdAt: newUser.createdAt,
  });

  return { user: newUser, isNew: true };
}

/**
 * Log in an existing user with Email and Password
 */
export async function loginUser(email: string, pass: string): Promise<any> {
  if (auth && isFirebaseConfigured) {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  }

  const rawUsers = typeof window !== "undefined" ? localStorage.getItem(LOCAL_USERS_KEY) : null;
  const users = rawUsers ? JSON.parse(rawUsers) : {};
  const existing = users[email.toLowerCase()];

  if (!existing) {
    throw new Error("USER_NOT_FOUND");
  }

  if (existing.password !== pass) {
    throw new Error("INVALID_PASSWORD");
  }

  localStorage.setItem(LOCAL_CURRENT_USER_KEY, JSON.stringify(existing));
  return existing;
}

/**
 * Sends a password reset email link
 */
export async function resetUserPassword(email: string): Promise<boolean> {
  if (auth && isFirebaseConfigured) {
    await sendPasswordResetEmail(auth, email);
    return true;
  }

  const rawUsers = typeof window !== "undefined" ? localStorage.getItem(LOCAL_USERS_KEY) : null;
  const users = rawUsers ? JSON.parse(rawUsers) : {};

  if (!users[email.toLowerCase()]) {
    throw new Error("USER_NOT_FOUND");
  }

  return true;
}

/**
 * Sign out current user
 */
export async function logOutUser(): Promise<void> {
  if (auth && isFirebaseConfigured) {
    await firebaseSignOut(auth);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_CURRENT_USER_KEY);
  }
}

/**
 * Save user company setup & call forwarding number to Firebase Realtime Database
 */
export async function saveCompanySetup(userId: string, setup: UserCompanySetup): Promise<void> {
  // Sync to Firebase Realtime Database
  await syncRealtimeDb(`users/${userId}/setup`, setup);

  if (typeof window !== "undefined") {
    localStorage.setItem(`${LOCAL_SETUP_KEY}_${userId}`, JSON.stringify(setup));
  }
}

/**
 * Fetch company setup for user
 */
export async function getCompanySetup(userId: string): Promise<UserCompanySetup | null> {
  // Try fetching from Firebase Realtime Database
  const remote = await fetchRealtimeDb(`users/${userId}/setup`);
  if (remote) return remote;

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(`${LOCAL_SETUP_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  }
  return null;
}
