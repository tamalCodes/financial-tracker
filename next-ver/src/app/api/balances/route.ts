import {
  createStartingBalance,
  updateClosingBalance,
} from "@/lib/api/balances";
import { loadDashboardData } from "@/lib/api/dashboard";
import { rateLimit } from "@/lib/api/rateLimit";
import { handleError, tooManyRequests } from "@/lib/api/responses";
import { startingBalanceSchema, validate } from "@/lib/api/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const limit = rateLimit(request, "balances:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, startingBalance } = validate(
      startingBalanceSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    await createStartingBalance(
      supabase,
      userId,
      currentMonth,
      Number(startingBalance)
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  const limit = rateLimit(request, "balances:put", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  try {
    const { currentMonth, startingBalance } = validate(
      startingBalanceSchema,
      await request.json()
    );

    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const data = await loadDashboardData(supabase, userId, currentMonth);
    const updated = await updateClosingBalance(
      supabase,
      userId,
      currentMonth,
      Number(startingBalance),
      data.credits,
      data.expenses,
      data.investments,
      { updateStarting: true }
    );

    return NextResponse.json({ ok: true, balance: updated });
  } catch (error) {
    return handleError(error);
  }
}
