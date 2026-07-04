import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Bill,
  Credit,
  EmiProgress,
  Expense,
  Investment,
  MonthSummary,
} from "@/features/dashboard/types/types";
import { loadEmiProgress } from "@/lib/api/emis";

// Recent-payments page size. The first page ships in the dashboard payload; pages
// 2+ are fetched lazily via GET /api/expenses. Keep in sync with the client.
export const EXPENSES_PAGE_SIZE = 6;

// One-off bills paginate like Recent payments: page 1 ships here, pages 2+ via GET
// /api/bills. Keep in sync with the client (useFinance).
export const BILLS_PAGE_SIZE = 6;

interface DashboardPayload {
  summary: MonthSummary;
  credits: Credit[];
  expenses: Expense[]; // first page only (newest EXPENSES_PAGE_SIZE)
  expensesTotal: number; // full month count (for pagination + the "N this month" line)
  loggedTotal: number; // full month Σ expenses (for the chip badge) — page-independent
  investments: Investment[];
  bills: Bill[]; // first page of one-off bills + all of this month's EMI installment rows
  billsTotal: number; // full month count of one-off bills (for Bills-card pagination)
  emis: EmiProgress[]; // EMI progress across all months — seeds the panel on first paint
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
  // Fast path: sum in Postgres (migration 006) — one scalar round trip instead of
  // shipping every historical amount row to the app. Falls back to the JS sweep if
  // the RPC isn't present yet (deploy can precede the migration).
  const rpc = await supabase.rpc("cumulative_left_in_bank", {
    p_month: currentMonth,
  });
  if (!rpc.error && rpc.data != null) {
    return Number(rpc.data);
  }

  return cumulativeLeftInBankJs(supabase, userId, currentMonth);
};

// JS fallback for the cumulative money model — retained so the app keeps working
// before migration 006 is applied, and to unit-test the formula without Postgres.
const cumulativeLeftInBankJs = async (
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
    oneOffBillsRes,
    emiBillsRes,
    billAmountsRes,
    leftInBank,
    emis,
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
      // One-off bills: first page only (newest-first), like Recent payments.
      supabase
        .from("bills")
        .select(
          "id, name, amount, due_date, paid, month, created_at, emi_id, emi_seq, emi_months, emi_total"
        )
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .is("emi_id", null)
        .order("created_at", { ascending: false })
        .range(0, BILLS_PAGE_SIZE - 1),
      // EMI installment rows for this month — all of them (the EMIs card needs every
      // one to render this month's Pay pill); there are few per user.
      supabase
        .from("bills")
        .select(
          "id, name, amount, due_date, paid, month, created_at, emi_id, emi_seq, emi_months, emi_total"
        )
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .not("emi_id", "is", null),
      // Amounts-only sweep across ALL of this month's bills: count of one-off bills
      // (for pagination) + Σ paid bills (for `spent`), page-independent.
      supabase
        .from("bills")
        .select("amount, paid, emi_id")
        .eq("user_id", userId)
        .eq("month", currentMonth),
      cumulativeLeftInBank(supabase, userId, currentMonth),
      loadEmiProgress(supabase, userId),
    ]);

  const credits = (creditsRes.data ?? []) as Credit[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const expenseAmounts = (expenseAmountsRes.data ?? []) as { amount: number }[];
  const investments = (investmentsRes.data ?? []) as Investment[];
  const oneOffBills = (oneOffBillsRes.data ?? []) as Bill[];
  const emiBills = (emiBillsRes.data ?? []) as Bill[];
  const billAmounts = (billAmountsRes.data ?? []) as {
    amount: number;
    paid: boolean;
    emi_id: string | null;
  }[];

  // Bills payload = page 1 of one-off bills + all EMI installment rows for the month
  // (the client filters by emi_id into the two cards).
  const bills = [...oneOffBills, ...emiBills];

  // Per-month tiles (reset each month). spent includes paid bills (DECISIONS D14).
  // Totals come from the full-month amounts sweep, NOT the paginated display rows.
  const earned = sumAmount(credits);
  const loggedTotal = sumAmount(expenseAmounts);
  const spent = loggedTotal + sumAmount(billAmounts.filter((b) => b.paid));
  const invested = sumAmount(investments);

  const summary: MonthSummary = { leftInBank, earned, spent, invested };

  return {
    summary,
    credits,
    expenses,
    expensesTotal: expenseAmounts.length,
    loggedTotal,
    investments,
    bills,
    billsTotal: billAmounts.filter((b) => b.emi_id === null).length,
    emis,
  };
};
