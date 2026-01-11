import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import Dashboard from "@/features/dashboard/Dashboard";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    redirect("/login");
  }
  return <Dashboard />;
}
