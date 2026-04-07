import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { rateLimit } from "@/lib/api/rateLimit";
import { getUserFromCookies } from "@/lib/supabase/auth";

export async function GET(request: Request) {
  const limit = rateLimit(request, "auth:me", {
    limit: 60,
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

  const localUser = await getUserFromCookies();
  if (localUser?.id) {
    return NextResponse.json({
      user: { id: localUser.id, email: localUser.email ?? null },
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: data.user ?? null });
}

