import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: data.user ?? null });
}
