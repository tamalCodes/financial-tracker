import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { emiCreateSchema, emiPatchSchema, validate } from "@/lib/api/schemas";
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

// Edit an EMI group: name/monthly/total apply to every installment sharing emi_id.
// Changing `monthly` rewrites `amount` on all rows (incl. already-paid ones, so past
// spend reflects the correction). Returns the refreshed roll-up.
export async function PATCH(request: Request) {
  const limit = rateLimit(request, "emis:patch", { limit: 15, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { emi_id, name, monthly, total } = validate(
      emiPatchSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (monthly !== undefined) patch.amount = monthly;
    if (total !== undefined) patch.emi_total = total;

    const { error } = await supabase
      .from("bills")
      .update(patch)
      .eq("emi_id", emi_id)
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const items = await loadEmiProgress(supabase, userId);
    return NextResponse.json({ items });
  } catch (error) {
    return handleError(error);
  }
}

// Delete a whole EMI: drops every installment row sharing emi_id.
export async function DELETE(request: Request) {
  const limit = rateLimit(request, "emis:delete", { limit: 15, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const emiId = searchParams.get("emi_id");
  if (!emiId) {
    return NextResponse.json({ error: "Missing emi_id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("emi_id", emiId)
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
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
