import { loadTrendData } from "@/lib/api/trend";
import { trendQuerySchema, validate } from "@/lib/api/schemas";
import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// GET /api/trend?month=YYYY-MM-01&months=6|12
// Monthly Earned/Spent/Invested series for the desktop trend chart. Read-only,
// user-scoped, same aggregation as the dashboard tiles (specs/features/desktop-dashboard.md).
export async function GET(request: Request) {
  const limit = rateLimit(request, "trend:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { searchParams } = new URL(request.url);
    // validate() throws a 400 NextResponse on bad input (caught below).
    const { month, months } = validate(trendQuerySchema, {
      month: searchParams.get("month"),
      months: searchParams.get("months"),
    });

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);
    const series = await loadTrendData(supabase, userId, month, months);
    return NextResponse.json({ series });
  } catch (error) {
    // A thrown NextResponse (validation 400) is re-returned as-is by handleError;
    // anything else is an unexpected server error (500), not masked as 400.
    return handleError(error, 500);
  }
}
