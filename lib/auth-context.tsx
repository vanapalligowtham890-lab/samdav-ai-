"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  isFirebaseConfigured, 
  signUpUser, 
  loginUser, 
  logOutUser, 
  resetUserPassword, 
  saveCompanySetup, 
  getCompanySetup, 
  UserCompanySetup 
} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

interface AuthUser {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  setup: UserCompanySetup | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<{ isNew: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateSetup: (data: UserCompanySetup) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function setSessionCookie(active: boolean) {
  if (typeof document === "undefined") return;
  if (active) {
    document.cookie = "vaani_session=active; path=/; max-age=604800; SameSite=Lax";
  } else {
    document.cookie = "vaani_session=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [setup, setSetup] = useState<UserCompanySetup | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    if (auth && isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const authUser = { uid: firebaseUser.uid, email: firebaseUser.email };
          setUser(authUser);
          setSessionCookie(true);
          const userSetup = await getCompanySetup(firebaseUser.uid);
          setSetup(userSetup);
        } else {
          setUser(null);
          setSetup(null);
          setSessionCookie(false);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local storage fallback for simulated users
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("vaani_current_user_mock");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setUser({ uid: parsed.uid, email: parsed.email });
            setSessionCookie(true);
            getCompanySetup(parsed.uid).then(setSetup);
          } catch {
            setUser(null);
            setSessionCookie(false);
          }
        } else {
          setUser(null);
          setSessionCookie(false);
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await loginUser(email, pass);
    const authUser = { uid: loggedInUser.uid, email: loggedInUser.email };
    setUser(authUser);
    setSessionCookie(true);
    const userSetup = await getCompanySetup(loggedInUser.uid);
    setSetup(userSetup);
  };

  const signup = async (email: string, pass: string) => {
    const res = await signUpUser(email, pass);
    const authUser = { uid: res.user.uid, email: res.user.email };
    setUser(authUser);
    setSessionCookie(true);
    return { isNew: res.isNew };
  };

  const logout = async () => {
    await logOutUser();
    setUser(null);
    setSetup(null);
    setSessionCookie(false);
  };

  const resetPassword = async (email: string) => {
    await resetUserPassword(email);
  };

  const updateSetup = async (data: UserCompanySetup) => {
    if (!user) return;
    await saveCompanySetup(user.uid, data);
    setSetup(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setup,
        loading,
        isFirebaseConnected: isFirebaseConfigured,
        login,
        signup,
        logout,
        resetPassword,
        updateSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
