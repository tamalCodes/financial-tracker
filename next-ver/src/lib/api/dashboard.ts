import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Bill,
  Credit,
  Expense,
  Investment,
  MonthSummary,
} from "@/features/dashboard/types/types";

// Recent-payments page size. The first page ships in the dashboard payload; pages
// 2+ are fetched lazily via GET /api/expenses. Keep in sync with the client.
export const EXPENSES_PAGE_SIZE = 6;

interface DashboardPayload {
  summary: MonthSummary;
  credits: Credit[];
  expenses: Expense[]; // first page only (newest EXPENSES_PAGE_SIZE)
  expensesTotal: number; // full month count (for pagination + the "N this month" line)
  loggedTotal: number; // full month Σ expenses (for the chip badge) — page-independent
  investments: Investment[];
  bills: Bill[];
}

const sumAmount = (rows: { amount: number }[]) =>
  rows.reduce((total, row) => total + Number(row.amount), 0);

/**
 * Cumulative "Left in bank" across every month <= currentMonth:
 *   opening_balance + Σ_{m ≤ month} ( Σcredits − Σexpenses − ΣpaidBills − Σinvestments )
 * opening_balance is the one-time signup bank balance (profiles.opening_balance, D-A);
 * it is NOT income, so it never feeds the per-month `earned` tile.
 * Month keys are 'YYYY-MM-01' text — lexicographically ordered, so `lte` is correct.
 * See specs/DATA_MODEL.md (money model), DECISIONS D13, and backend-wiring-checklist §1 D-A.
 */
export const cumulativeLeftInBank = async (
  supabase: SupabaseClient,
  userId: string,
  currentMonth: string
): Promise<number> => {
  const [creditsRes, expensesRes, investmentsRes, paidBillsRes, profileRes] =
    await Promise.all([
      supabase
        .from("credits")
        .select("amount")
        .eq("user_id", userId)
        .lte("month", currentMonth),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .lte("month", currentMonth),
      supabase
        .from("investments")
        .select("amount")
        .eq("user_id", userId)
        .lte("month", currentMonth),
      supabase
        .from("bills")
        .select("amount")
        .eq("user_id", userId)
        .eq("paid", true)
        .lte("month", currentMonth),
      supabase
        .from("profiles")
        .select("opening_balance")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const openingBalance = Number(profileRes.data?.opening_balance ?? 0);
  const earned = sumAmount(creditsRes.data ?? []);
  const spent =
    sumAmount(expensesRes.data ?? []) + sumAmount(paidBillsRes.data ?? []);
  const invested = sumAmount(investmentsRes.data ?? []);

  return openingBalance + earned - spent - invested;
};

export const loadDashboardData = async (
  supabase: SupabaseClient,
  userId: string,
  currentMonth: string
): Promise<DashboardPayload> => {
  const [
    creditsRes,
    expensesRes,
    expenseAmountsRes,
    investmentsRes,
    billsRes,
    leftInBank,
  ] = await Promise.all([
      supabase
        .from("credits")
        .select("id, description, amount, created_at")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .order("created_at", { ascending: false }),
      // Display rows: first page only (newest first).
      supabase
        .from("expenses")
        .select("id, description, amount, category, tag, created_at")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .order("created_at", { ascending: false })
        .range(0, EXPENSES_PAGE_SIZE - 1),
      // Amounts-only sweep: month total count + Σ for `spent`/`loggedTotal`, page-independent.
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .eq("month", currentMonth),
      supabase
        .from("investments")
        .select("id, description, amount, month, created_at")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .order("created_at", { ascending: false }),
      supabase
        .from("bills")
        .select(
          "id, name, amount, due_date, paid, month, created_at, emi_id, emi_seq, emi_months, emi_total"
        )
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .order("due_date", { ascending: true }),
      cumulativeLeftInBank(supabase, userId, currentMonth),
    ]);

  const credits = (creditsRes.data ?? []) as Credit[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const expenseAmounts = (expenseAmountsRes.data ?? []) as { amount: number }[];
  const investments = (investmentsRes.data ?? []) as Investment[];
  const bills = (billsRes.data ?? []) as Bill[];

  // Per-month tiles (reset each month). spent includes paid bills (DECISIONS D14).
  // Totals come from the full-month amounts sweep, NOT the paginated display rows.
  const earned = sumAmount(credits);
  const loggedTotal = sumAmount(expenseAmounts);
  const spent = loggedTotal + sumAmount(bills.filter((b) => b.paid));
  const invested = sumAmount(investments);

  const summary: MonthSummary = { leftInBank, earned, spent, invested };

  // TEMP diagnostic — confirms the paginated build is live (server terminal).
  console.log(
    `[FT][server] month=${currentMonth} pageRows=${expenses.length} expensesTotal=${expenseAmounts.length} loggedTotal=${loggedTotal}`
  );

  return {
    summary,
    credits,
    expenses,
    expensesTotal: expenseAmounts.length,
    loggedTotal,
    investments,
    bills,
  };
};
