import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { Credit, Expense, Investment } from "@/features/dashboard/types/types";

export const updateClosingBalance = async (
  currentMonth: string,
  starting: number,
  creditList: Credit[],
  expenseList: Expense[],
  investmentList: Investment[],
  options: { updateStarting?: boolean } = {}
) => {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (authError || !userId) {
    throw new Error("Unauthorized");
  }

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
  const closing = starting - totalExpenses - totalInvestments + totalCredits;

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
  currentMonth: string,
  starting: number
) => {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const userId = auth?.user?.id;

  if (authError || !userId) {
    throw new Error("Unauthorized");
  }

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

