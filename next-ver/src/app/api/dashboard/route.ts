import { loadDashboardData } from "@/lib/api/dashboard";
import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const limit = rateLimit(request, "dashboard:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Missing month." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);
    const data = await loadDashboardData(supabase, userId, month);
    return NextResponse.json(data);
  } catch (error) {
    // Read endpoint: don't mask unexpected server errors as 400.
    return handleError(error, 500);
  }
}
