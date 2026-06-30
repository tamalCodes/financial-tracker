"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextType {
  user: { id: string; email?: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    openingBalance?: number
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: AuthContextType["user"] };
      setUser(data.user ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unable to sign in");
    }
    await refreshUser();
  };

  const signUp = async (
    email: string,
    password: string,
    openingBalance = 0
  ) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, openingBalance }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unable to sign up");
    }
    await refreshUser();
  };

  const signOut = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Unable to sign out");
    }
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
