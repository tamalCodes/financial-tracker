import AuthForm from "@/features/auth/components/AuthForm";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect("/dashboard");
  }
  return <AuthForm initialMode="login" />;
}
