import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// Investments panel — the manual portfolio total + Fixed Deposits/Mutual Funds
// (holdings) + Active SIPs, in ONE request. Consolidates what used to be three
// separate GETs (/api/portfolio, /api/holdings, /api/sips) so the mobile home
// fans out to one serverless invocation instead of three on first paint.
// Mutations still use the per-resource routes. Display-only (DECISIONS D15).
const HOLDINGS_SELECT =
  "id, kind, name, current_value, rate, maturity_date, created_at";
const SIPS_SELECT = "id, name, monthly, due_date, paid_total, created_at";

export async function GET(request: Request) {
  const limit = rateLimit(request, "portfolio-panel:get", {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const [totalRes, holdingsRes, sipsRes] = await Promise.all([
      supabase
        .from("portfolio_totals")
        .select("value")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("holdings")
        .select(HOLDINGS_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("sips")
        .select(SIPS_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    const firstError =
      totalRes.error ?? holdingsRes.error ?? sipsRes.error ?? null;
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    return NextResponse.json({
      value: totalRes.data?.value ?? 0,
      holdings: holdingsRes.data ?? [],
      sips: sipsRes.data ?? [],
    });
  } catch (error) {
    return handleError(error, 500);
  }
}
