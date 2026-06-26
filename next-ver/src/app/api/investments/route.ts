import { applyBalanceDelta } from "@/lib/api/balances";
import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { mutationCreateSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

const SELECT =
  "id, description, amount, carry_forward, start_month, created_at, is_active";

export async function POST(request: Request) {
  const limit = rateLimit(request, "investments:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, description, amount, carry_forward } = validate(
      mutationCreateSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("investments")
      .insert({
        user_id: userId,
        start_month: currentMonth,
        description,
        amount,
        is_active: true,
        carry_forward: Boolean(carry_forward),
      })
      .select(SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const balance = await applyBalanceDelta(
      supabase,
      userId,
      currentMonth,
      -Number(amount)
    );

    return NextResponse.json({ item: inserted, balance });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const limit = rateLimit(request, "investments:delete", { limit: 30, windowMs: 60_000 });
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
      .from("investments")
      .select("amount, start_month")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Investment not found." },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("investments")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const balance = await applyBalanceDelta(
      supabase,
      userId,
      existing.start_month,
      Number(existing.amount)
    );

    return NextResponse.json({ ok: true, balance });
  } catch (error) {
    return handleError(error);
  }
}
