import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";

export async function POST(request: Request) {
  const payload = await request.json();
  const { currentMonth, description, amount, carry_forward } = payload ?? {};

  if (!currentMonth || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("investments").insert({
    user_id: userId,
    start_month: currentMonth,
    description,
    amount,
    is_active: true,
    carry_forward: Boolean(carry_forward),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (authError || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("investments")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
