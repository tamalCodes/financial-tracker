import Dashboard from "@/features/dashboard/Dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/login");
  }
  return <Dashboard />;
}
