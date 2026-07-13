import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { portfolioTotalSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// Manual portfolio total — one row per user (portfolio_totals.user_id is PK).
// Display-only; no money-model effect (DECISIONS D15).

export async function GET(request: Request) {
  const limit = rateLimit(request, "portfolio:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data, error } = await supabase
      .from("portfolio_totals")
      .select("value")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ value: data?.value ?? 0 });
  } catch (error) {
    return handleError(error, 500);
  }
}

export async function PUT(request: Request) {
  const limit = rateLimit(request, "portfolio:put", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { value } = validate(portfolioTotalSchema, await request.json());

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data, error } = await supabase
      .from("portfolio_totals")
      .upsert({ user_id: userId, value }, { onConflict: "user_id" })
      .select("value")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ value: data.value });
  } catch (error) {
    return handleError(error);
  }
}
