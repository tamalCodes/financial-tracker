import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { emiCreateSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { loadEmiProgress } from "@/lib/api/emis";
import { shiftMonthKey } from "@/features/dashboard/utils/dates";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

// EMIs live on the `bills` table as pre-created installment rows sharing an `emi_id`.
// POST expands an EMI into one bill row per month for its whole duration; paying an
// installment is a normal bills PATCH (marks that month paid → counts toward spend).
// GET rolls every EMI group up into progress figures across all months.

export async function POST(request: Request) {
  const limit = rateLimit(request, "emis:post", { limit: 15, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, name, monthly, total, months } = validate(
      emiCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const emiId = randomUUID();
    // One row per installment, starting at currentMonth. emi_seq is 1-based.
    const rows = Array.from({ length: months }, (_, i) => ({
      user_id: userId,
      month: shiftMonthKey(currentMonth, i),
      name,
      amount: monthly,
      due_date: null,
      paid: false,
      emi_id: emiId,
      emi_seq: i + 1,
      emi_months: months,
      emi_total: total,
    }));

    const { error } = await supabase.from("bills").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ emi_id: emiId, installments: months });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: Request) {
  const limit = rateLimit(request, "emis:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const items = await loadEmiProgress(supabase, userId);
    return NextResponse.json({ items });
  } catch (error) {
    return handleError(error, 500);
  }
}
