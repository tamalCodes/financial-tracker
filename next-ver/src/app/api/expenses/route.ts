import { applyBalanceDelta } from "@/lib/api/balances";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { getUserFromCookies } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const { currentMonth, description, amount, carry_forward } = payload ?? {};

  if (!currentMonth || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const localUser = await getUserFromCookies();
  let userId = localUser?.id;
  if (!userId) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    userId = auth?.user?.id;
    if (authError || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      month: currentMonth,
      description,
      amount,
      carry_forward: Boolean(carry_forward),
    })
    .select(
      "id, description, amount, created_at, carry_forward, carried_from_month"
    )
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
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const { id, description, amount, carry_forward } = payload ?? {};

  if (!id || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const localUser = await getUserFromCookies();
  let userId = localUser?.id;
  if (!userId) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    userId = auth?.user?.id;
    if (authError || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { data: existing, error: fetchError } = await supabase
    .from("expenses")
    .select("amount, month")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("expenses")
    .update({
      description,
      amount,
      carry_forward: Boolean(carry_forward),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(
      "id, description, amount, created_at, carry_forward, carried_from_month"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const delta = Number(existing.amount) - Number(amount);
  const balance = await applyBalanceDelta(
    supabase,
    userId,
    existing.month,
    delta
  );

  return NextResponse.json({ item: updated, balance });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const localUser = await getUserFromCookies();
  let userId = localUser?.id;
  if (!userId) {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    userId = auth?.user?.id;
    if (authError || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { data: existing, error: fetchError } = await supabase
    .from("expenses")
    .select("amount, month")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("expenses")
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
    Number(existing.amount)
  );

  return NextResponse.json({ ok: true, balance });
}
