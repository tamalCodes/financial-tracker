import { applyBalanceDelta } from "@/lib/api/balances";
import { rateLimit } from "@/lib/api/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

const tooManyRequests = (resetMs: number) =>
  NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
  );

const handleError = (error: unknown) => {
  if (error instanceof NextResponse) return error; // 401 from requireUser
  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
};

export async function POST(request: Request) {
  const limit = rateLimit(request, "credits:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const payload = await request.json();
  const { currentMonth, description, amount, carry_forward } = payload ?? {};

  if (!currentMonth || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
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

  const payload = await request.json();
  const { id, description, amount, carry_forward } = payload ?? {};

  if (!id || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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
