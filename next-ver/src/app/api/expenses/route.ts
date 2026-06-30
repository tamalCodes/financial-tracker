import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import {
  mutationCreateSchema,
  mutationUpdateSchema,
  validate,
} from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { EXPENSES_PAGE_SIZE } from "@/lib/api/dashboard";
import { NextResponse } from "next/server";

// Per-month spend with a category enum (mobile redesign). No balance side-effects —
// spent_m and Left-in-bank are computed on read (DECISIONS D13).
// NOTE: `tags` is NOT selected/written — the live DB has no such column (schema drift).
const SELECT = "id, description, amount, category, created_at";

// Paginated recent payments. Page 1 ships inside /api/dashboard; this serves 2+.
// `page` is 1-based; rows are newest-first to match the dashboard order.
export async function GET(request: Request) {
  const limit = rateLimit(request, "expenses:get", { limit: 60, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return NextResponse.json({ error: "Missing month." }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize =
    Math.max(1, Number(searchParams.get("pageSize")) || EXPENSES_PAGE_SIZE);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data, count, error } = await supabase
      .from("expenses")
      .select(SELECT, { count: "exact" })
      .eq("user_id", userId)
      .eq("month", month)
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
  const limit = rateLimit(request, "expenses:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, description, amount, category } = validate(
      mutationCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        month: currentMonth,
        description,
        amount,
        category: category ?? "other",
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

export async function PUT(request: Request) {
  const limit = rateLimit(request, "expenses:put", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { id, description, amount, category } = validate(
      mutationUpdateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const update: Record<string, unknown> = { description, amount };
    if (category) update.category = category;

    const { data: updated, error } = await supabase
      .from("expenses")
      .update(update)
      .eq("id", id)
      .eq("user_id", userId)
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!updated) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimit(request, "expenses:delete", { limit: 30, windowMs: 60_000 });
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
      .from("expenses")
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
