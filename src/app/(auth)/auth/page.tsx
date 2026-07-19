import AuthForm from "@/features/auth/components/AuthForm";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { redirect } from "next/navigation";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const supabase = await createSupabaseServerClient();
  const [{ data }, params] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
  ]);

  if (data?.user) {
    redirect("/dashboard");
  }

  return <AuthForm initialMode={params.mode === "signup" ? "signup" : "login"} />;
}
