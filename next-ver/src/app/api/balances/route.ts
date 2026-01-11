import { NextResponse } from "next/server";
import { createStartingBalance, updateClosingBalance } from "@/lib/api/balances";
import { loadDashboardData } from "@/lib/api/dashboard";

export async function POST(request: Request) {
  const payload = await request.json();
  const { currentMonth, startingBalance } = payload ?? {};

  if (!currentMonth || startingBalance === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    await createStartingBalance(currentMonth, Number(startingBalance));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to set starting balance.";
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
    const data = await loadDashboardData(currentMonth);
    const updated = await updateClosingBalance(
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
