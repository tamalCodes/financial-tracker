import { rateLimit } from "@/lib/api/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { NextResponse } from "next/server";

const PROVIDERS = new Set(["google", "apple"]);

export async function POST(request: Request) {
  const limit = rateLimit(request, "auth:oauth", {
    limit: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) },
      },
    );
  }

  const { provider } = (await request.json()) as { provider?: string };
  if (!provider || !PROVIDERS.has(provider)) {
    return NextResponse.json(
      { error: "Unsupported sign-in provider." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = new URL("/auth/callback", request.url).toString();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "apple",
    options: { redirectTo },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: error?.message || "Unable to start social sign in." },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: data.url });
}
