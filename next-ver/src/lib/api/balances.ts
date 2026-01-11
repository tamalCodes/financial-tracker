import type { SupabaseClient } from "@supabase/supabase-js";
import { Credit, Expense, Investment } from "@/features/dashboard/types/types";

export const calculateClosingBalance = (
  starting: number,
  creditList: Credit[],
  expenseList: Expense[],
  investmentList: Investment[]
) => {
  const totalCredits = creditList.reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );
  const totalExpenses = expenseList.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const totalInvestments = investmentList.reduce(
    (sum, i) => sum + Number(i.amount),
    0
  );
  return starting - totalExpenses - totalInvestments + totalCredits;
};

export const updateClosingBalance = async (
  supabase: SupabaseClient,
  userId: string,
  currentMonth: string,
  starting: number,
  creditList: Credit[],
  expenseList: Expense[],
  investmentList: Investment[],
  options: { updateStarting?: boolean } = {}
) => {
  const closing = calculateClosingBalance(
    starting,
    creditList,
    expenseList,
    investmentList
  );

  const { error } = await supabase
    .from("monthly_balances")
    .update(
      options.updateStarting
        ? { starting_balance: starting, closing_balance: closing }
        : { closing_balance: closing }
    )
    .eq("user_id", userId)
    .eq("month", currentMonth);

  if (error) {
    throw new Error(error.message ?? "Failed to update closing balance");
  }

  return { starting_balance: starting, closing_balance: closing };
};

export const createStartingBalance = async (
  supabase: SupabaseClient,
  userId: string,
  currentMonth: string,
  starting: number
) => {
  const { error } = await supabase.from("monthly_balances").insert({
    user_id: userId,
    month: currentMonth,
    starting_balance: starting,
    closing_balance: starting,
  });

  if (error) {
    throw new Error(error.message ?? "Failed to set starting balance");
  }
};

export const applyBalanceDelta = async (
  supabase: SupabaseClient,
  userId: string,
  currentMonth: string,
  delta: number
) => {
  const { data: balance, error: balanceError } = await supabase
    .from("monthly_balances")
    .select("starting_balance, closing_balance")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  if (balanceError) {
    throw new Error(balanceError.message ?? "Failed to load balance");
  }

  if (!balance) {
    return null;
  }

  const nextClosing = Number(balance.closing_balance) + Number(delta);
  const { data: updated, error: updateError } = await supabase
    .from("monthly_balances")
    .update({ closing_balance: nextClosing })
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .select("starting_balance, closing_balance")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message ?? "Failed to update balance");
  }

  return updated ?? { ...balance, closing_balance: nextClosing };
};

