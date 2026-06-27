import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import {
  mutationCreateSchema,
  mutationUpdateSchema,
  validate,
} from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

// Per-month spend with a category enum (mobile redesign). No balance side-effects —
// spent_m and Left-in-bank are computed on read (DECISIONS D13). `tags` kept (legacy).
const SELECT = "id, description, amount, category, created_at, tags";

export async function POST(request: Request) {
  const limit = rateLimit(request, "expenses:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, description, amount, category, tags } = validate(
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
        tags: tags ?? [],
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
    const { id, description, amount, category, tags } = validate(
      mutationUpdateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const update: Record<string, unknown> = { description, amount, tags: tags ?? [] };
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
