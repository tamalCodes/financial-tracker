import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import {
  Credit,
  Expense,
  Investment,
  MonthlyBalance,
} from "@/features/dashboard/types/types";
import { shiftMonthKey } from "@/features/dashboard/utils/dates";
import { updateClosingBalance } from "@/lib/api/balances";

interface DashboardPayload {
  balance: MonthlyBalance | null;
  credits: Credit[];
  expenses: Expense[];
  investments: Investment[];
}

export const loadDashboardData = async (
  currentMonth: string
): Promise<DashboardPayload> => {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (authError || !userId) {
    throw new Error("Unauthorized");
  }

  const previousMonth = shiftMonthKey(currentMonth, -1);

  await Promise.all([
    ensureCarryForwardExpenses(userId, previousMonth, currentMonth),
    ensureCarryForwardCredits(userId, previousMonth, currentMonth),
  ]);

  const { data: balanceData } = await supabase
    .from("monthly_balances")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  let resolvedBalance = balanceData ?? null;

  if (!resolvedBalance) {
    const { data: previousBalance } = await supabase
      .from("monthly_balances")
      .select("closing_balance")
      .eq("user_id", userId)
      .eq("month", previousMonth)
      .maybeSingle();

    if (previousBalance?.closing_balance !== undefined) {
      const { data: insertedBalance, error: insertError } = await supabase
        .from("monthly_balances")
        .insert({
          user_id: userId,
          month: currentMonth,
          starting_balance: previousBalance.closing_balance,
          closing_balance: previousBalance.closing_balance,
        })
        .select()
        .single();

      if (!insertError) {
        resolvedBalance = insertedBalance;
      } else if (insertError.code === "23505") {
        const { data: existingBalance } = await supabase
          .from("monthly_balances")
          .select("*")
          .eq("user_id", userId)
          .eq("month", currentMonth)
          .maybeSingle();
        resolvedBalance = existingBalance ?? null;
      }
    }
  }

  const [creditsResult, expensesResult, investmentsResult] = await Promise.all([
    supabase
      .from("credits")
      .select("id, description, amount, created_at, carry_forward")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select(
        "id, description, amount, created_at, carry_forward, carried_from_month"
      )
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .order("created_at", { ascending: false }),
    supabase
      .from("investments")
      .select(
        "id, description, amount, carry_forward, start_month, created_at, is_active"
      )
      .eq("user_id", userId)
      .lte("start_month", currentMonth)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const creditsData = creditsResult.data ?? [];
  const expensesData = expensesResult.data ?? [];
  const investmentsData = investmentsResult.data ?? [];

  const filteredInvestments = investmentsData.filter((investment) => {
    const shouldCarryForward = investment.carry_forward ?? false;
    if (shouldCarryForward) {
      return true;
    }
    return investment.start_month === currentMonth;
  });

  if (resolvedBalance) {
    resolvedBalance = await updateClosingBalance(
      currentMonth,
      resolvedBalance.starting_balance,
      creditsData,
      expensesData,
      filteredInvestments
    );
  }

  return {
    balance: resolvedBalance,
    credits: creditsData,
    expenses: expensesData,
    investments: filteredInvestments,
  };
};

const ensureCarryForwardExpenses = async (
  userId: string,
  previousMonth: string,
  currentMonth: string
) => {
  const supabase = createSupabaseServerClient();

  const { data: recurringExpenses } = await supabase
    .from("expenses")
    .select("id, description, amount, carry_forward")
    .eq("user_id", userId)
    .eq("month", previousMonth)
    .eq("carry_forward", true);

  if (!recurringExpenses || recurringExpenses.length === 0) {
    return;
  }

  const { data: existingCopies } = await supabase
    .from("expenses")
    .select("description, amount, carried_from_month")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .eq("carried_from_month", previousMonth);

  const existingKeys = new Set(
    (existingCopies ?? []).map(
      (item) => `${item.description}|${Number(item.amount)}`
    )
  );

  const insertPayload = recurringExpenses
    .filter(
      (item) => !existingKeys.has(`${item.description}|${Number(item.amount)}`)
    )
    .map((item) => ({
      user_id: userId,
      month: currentMonth,
      description: item.description,
      amount: item.amount,
      carry_forward: true,
      carried_from_month: previousMonth,
    }));

  if (insertPayload.length > 0) {
    await supabase.from("expenses").insert(insertPayload);
  }
};

const ensureCarryForwardCredits = async (
  userId: string,
  previousMonth: string,
  currentMonth: string
) => {
  const supabase = createSupabaseServerClient();

  const { data: recurringCredits } = await supabase
    .from("credits")
    .select("id, description, amount, carry_forward")
    .eq("user_id", userId)
    .eq("month", previousMonth)
    .eq("carry_forward", true);

  if (!recurringCredits || recurringCredits.length === 0) {
    return;
  }

  const { data: existingCopies } = await supabase
    .from("credits")
    .select("description, amount, carried_from_month")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .eq("carried_from_month", previousMonth);

  const existingKeys = new Set(
    (existingCopies ?? []).map(
      (item) => `${item.description}|${Number(item.amount)}`
    )
  );

  const insertPayload = recurringCredits
    .filter(
      (item) => !existingKeys.has(`${item.description}|${Number(item.amount)}`)
    )
    .map((item) => ({
      user_id: userId,
      month: currentMonth,
      description: item.description,
      amount: item.amount,
      carry_forward: true,
      carried_from_month: previousMonth,
    }));

  if (insertPayload.length > 0) {
    await supabase.from("credits").insert(insertPayload);
  }
};
