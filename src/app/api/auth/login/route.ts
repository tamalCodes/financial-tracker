import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { supabaseServer } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/api/rateLimit";

const recordLastLogin = async (userId: string, loggedInAt: string) => {
  const db = supabaseServer as unknown as SupabaseClient;
  const { error } = await db
    .from("profiles")
    .upsert({ user_id: userId, last_login_at: loggedInAt }, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Failed to record last login: ${error.message}`);
  }
};

export async function POST(request: Request) {
  const limit = rateLimit(request, "auth:login", {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      }
    );
  }

  const { email, password } = (await request.json()) as {
    email: string;
    password: string;
  };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Login failed." }, { status: 401 });
  }

  try {
    await recordLastLogin(userId, new Date().toISOString());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to record last login." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
