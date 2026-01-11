import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { rateLimit } from "@/lib/api/rateLimit";

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

