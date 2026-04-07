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
    .from("investments")
    .insert({
      user_id: userId,
      start_month: currentMonth,
      description,
      amount,
      is_active: true,
      carry_forward: Boolean(carry_forward),
    })
    .select(
      "id, description, amount, carry_forward, start_month, created_at, is_active"
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
}
