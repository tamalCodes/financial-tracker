"use client";

import AuthForm from "@/features/auth/components/AuthForm";
import Dashboard from "@/features/dashboard/Dashboard";
import { useAuth } from "@/features/auth/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthForm />;
}
