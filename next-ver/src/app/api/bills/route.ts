import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { billCreateSchema, billPatchSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { BILLS_PAGE_SIZE } from "@/lib/api/dashboard";
import { NextResponse } from "next/server";

// Bills — a separate ledger from expenses. A one-off bill is PAID the moment it is
// added (added == already paid), so it counts toward spent_m and Left-in-bank right
// away (DECISIONS D14); it never creates an expense. No overdue state, no Pay step.
// EMI installments (emi_id set) are the exception — they stay unpaid future rows paid
// month-by-month (D17). Conventions: CONVENTIONS §1–§7.
const SELECT =
  "id, name, amount, due_date, paid, month, created_at, emi_id, emi_seq, emi_months, emi_total";

// Paginated one-off bills, newest-first. Page 1 ships inside /api/dashboard; this
// serves pages 2+. EMI installment rows are excluded (they roll up in the EMIs card).
export async function GET(request: Request) {
  const limit = rateLimit(request, "bills:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "Missing month." }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize =
    Math.max(1, Number(searchParams.get("pageSize")) || BILLS_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data, count, error } = await supabase
      .from("bills")
      .select(SELECT, { count: "exact" })
      .eq("user_id", userId)
      .eq("month", month)
      .is("emi_id", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0 });
  } catch (error) {
    return handleError(error, 500);
  }
}

export async function POST(request: Request) {
  const limit = rateLimit(request, "bills:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, name, amount, due_date } = validate(
      billCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("bills")
      .insert({
        user_id: userId,
        month: currentMonth,
        name,
        amount,
        due_date: due_date ?? null,
        paid: true, // added == already paid (DECISIONS D14); no Pay step
      })
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: inserted });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  const limit = rateLimit(request, "bills:patch", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { id, paid, name, amount } = validate(billPatchSchema, await request.json());

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    // Only touch the fields the client sent (pay toggle and/or an edit).
    const patch: Record<string, unknown> = {};
    if (paid !== undefined) patch.paid = paid;
    if (name !== undefined) patch.name = name;
    if (amount !== undefined) patch.amount = amount;

    const { data: updated, error } = await supabase
      .from("bills")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!updated) {
      return NextResponse.json({ error: "Bill not found." }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimit(request, "bills:delete", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
