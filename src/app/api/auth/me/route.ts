import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { rateLimit } from "@/lib/api/rateLimit";
import { getLiveUser } from "@/lib/supabase/auth";

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

  // getLiveUser applies the kill switch: a force-logged-out session resolves to
  // null here, so the client's AuthContext drops the user and shows login.
  const supabase = await createSupabaseServerClient();
  const user = await getLiveUser(supabase);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      email: user.email,
      fullName: user.fullName,
    },
  });
}

