import {
  createStartingBalance,
  updateClosingBalance,
} from "@/lib/api/balances";
import { loadDashboardData } from "@/lib/api/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { getUserFromCookies } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const { currentMonth, startingBalance } = payload ?? {};

  if (!currentMonth || startingBalance === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const localUser = await getUserFromCookies();
    if (!localUser?.id) {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      await createStartingBalance(
        supabase,
        auth.user.id,
        currentMonth,
        Number(startingBalance)
      );
      return NextResponse.json({ ok: true });
    }

    await createStartingBalance(
      supabase,
      localUser.id,
      currentMonth,
      Number(startingBalance)
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to set starting balance.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const { currentMonth, startingBalance } = payload ?? {};

  if (!currentMonth || startingBalance === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const localUser = await getUserFromCookies();
    if (!localUser?.id) {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const data = await loadDashboardData(supabase, auth.user.id, currentMonth);
      const updated = await updateClosingBalance(
        supabase,
        auth.user.id,
        currentMonth,
        Number(startingBalance),
        data.credits,
        data.expenses,
        data.investments,
        { updateStarting: true }
      );
      return NextResponse.json({ ok: true, balance: updated });
    }

    const data = await loadDashboardData(supabase, localUser.id, currentMonth);
    const updated = await updateClosingBalance(
      supabase,
      localUser.id,
      currentMonth,
      Number(startingBalance),
      data.credits,
      data.expenses,
      data.investments,
      { updateStarting: true }
    );
    return NextResponse.json({ ok: true, balance: updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update balance.";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
