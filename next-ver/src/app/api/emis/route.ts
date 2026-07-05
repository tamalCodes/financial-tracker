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
// spend reflects the correction). `startMonth` re-anchors the whole schedule (each
// installment's month = startMonth + emi_seq-1) — set it to a past month to back-date
// an EMI that started earlier. `paidCount` marks the first N installments (by emi_seq)
// paid and the rest unpaid, so a user can record "I've already paid 4 of 8" — this
// flips `paid` flags, which is exactly what feeds each month's spend. With a past
// startMonth those paid installments land on past months. Returns the refreshed roll-up.
export async function PATCH(request: Request) {
  const limit = rateLimit(request, "emis:patch", { limit: 15, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { emi_id, name, monthly, total, paidCount, startMonth } = validate(
      emiPatchSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const patch: Record<string, unknown> = {};
    if (name !== undefined) patch.name = name;
    if (monthly !== undefined) patch.amount = monthly;
    if (total !== undefined) patch.emi_total = total;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase
        .from("bills")
        .update(patch)
        .eq("emi_id", emi_id)
        .eq("user_id", userId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // startMonth: re-anchor each installment's month by its emi_seq (1-based).
    if (startMonth !== undefined) {
      const { data: rows, error: fetchErr } = await supabase
        .from("bills")
        .select("id, emi_seq")
        .eq("emi_id", emi_id)
        .eq("user_id", userId);
      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 400 });
      }
      const results = await Promise.all(
        (rows ?? []).map((r) =>
          supabase
            .from("bills")
            .update({ month: shiftMonthKey(startMonth, Number(r.emi_seq) - 1) })
            .eq("id", r.id as string)
            .eq("user_id", userId)
        )
      );
      const err = results.find((res) => res.error)?.error;
      if (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    // paidCount: first N installments (emi_seq 1..N) paid, the rest unpaid.
    if (paidCount !== undefined) {
      const paidRes = await supabase
        .from("bills")
        .update({ paid: true })
        .eq("emi_id", emi_id)
        .eq("user_id", userId)
        .lte("emi_seq", paidCount);
      const unpaidRes = await supabase
        .from("bills")
        .update({ paid: false })
        .eq("emi_id", emi_id)
        .eq("user_id", userId)
        .gt("emi_seq", paidCount);
      const err = paidRes.error ?? unpaidRes.error;
      if (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
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
