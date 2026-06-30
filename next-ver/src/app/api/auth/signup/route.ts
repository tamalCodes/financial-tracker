import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { signupSchema, validate } from "@/lib/api/schemas";

export async function POST(request: Request) {
  const limit = rateLimit(request, "auth:signup", {
    limit: 6,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { email, password, openingBalance } = validate(
      signupSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    // Opening bank balance (D-A) is passed as signup metadata. A SECURITY DEFINER
    // trigger (handle_new_user, migration 003) seeds public.profiles from it — at
    // signup there is no session yet, so an anon-client insert would be blocked by RLS.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { opening_balance: openingBalance } },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
