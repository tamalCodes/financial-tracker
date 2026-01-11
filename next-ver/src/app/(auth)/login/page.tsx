import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import AuthForm from "@/features/auth/components/AuthForm";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect("/dashboard");
  }
  return <AuthForm initialMode="login" />;
}
