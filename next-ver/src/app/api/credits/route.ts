import { applyBalanceDelta } from "@/lib/api/balances";
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

export async function POST(request: Request) {
  const limit = rateLimit(request, "credits:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, description, amount, carry_forward } = validate(
      mutationCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("credits")
      .insert({
        user_id: userId,
        month: currentMonth,
        description,
        amount,
        carry_forward: Boolean(carry_forward),
      })
      .select("id, description, amount, created_at, carry_forward")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const balance = await applyBalanceDelta(
      supabase,
      userId,
      currentMonth,
      Number(amount)
    );

    return NextResponse.json({ item: inserted, balance });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  const limit = rateLimit(request, "credits:put", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { id, description, amount, carry_forward } = validate(
      mutationUpdateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: existing, error: fetchError } = await supabase
      .from("credits")
      .select("amount, month")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Credit not found." }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("credits")
      .update({
        description,
        amount,
        carry_forward: Boolean(carry_forward),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, description, amount, created_at, carry_forward")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const delta = Number(amount) - Number(existing.amount);
    const balance = await applyBalanceDelta(
      supabase,
      userId,
      existing.month,
      delta
    );

    return NextResponse.json({ item: updated, balance });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimit(request, "credits:delete", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: existing, error: fetchError } = await supabase
      .from("credits")
      .select("amount, month")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Credit not found." }, { status: 404 });
    }

    const { error } = await supabase
      .from("credits")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const balance = await applyBalanceDelta(
      supabase,
      userId,
      existing.month,
      -Number(existing.amount)
    );

    return NextResponse.json({ ok: true, balance });
  } catch (error) {
    return handleError(error);
  }
}
