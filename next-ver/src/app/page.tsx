"use client";

import { useAuth } from "@/features/auth/AuthContext";
import AuthForm from "@/features/auth/components/AuthForm";
import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/features/dashboard/Dashboard"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const { user } = useAuth();

  return user ? <Dashboard /> : <AuthForm />;
}
