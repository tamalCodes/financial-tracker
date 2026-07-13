import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { sipPaymentCreateSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// Records selected SIPs exactly once per month. The database function atomically
// updates SIP totals, mutual-fund holdings, portfolio total, and optional cash flow.
export async function POST(request: Request) {
  const limit = rateLimit(request, "sip-payments:post", { limit: 12, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, sipIds, debitBalance } = validate(
      sipPaymentCreateSchema,
      await request.json(),
    );
    const supabase = await createSupabaseServerClient();
    await requireUser(supabase);
    const { data, error } = await supabase.rpc("record_sip_payments", {
      p_month: currentMonth,
      p_sip_ids: sipIds,
      p_debit_balance: debitBalance,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ payment: data?.[0] ?? null });
  } catch (error) {
    return handleError(error);
  }
}
