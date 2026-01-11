import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as {
    email: string;
    password: string;
  };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
