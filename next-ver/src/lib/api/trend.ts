import type { SupabaseClient } from "@supabase/supabase-js";

// Monthly-trend series for the desktop dashboard chart. Aggregates the SAME money
// model as the per-month tiles (lib/api/dashboard.ts): for each month,
//   earned   = Σ credits
//   spent    = Σ expenses + Σ paid bills   (DECISIONS D14)
//   invested = Σ investments
// Read-only, user-scoped, no balance write (D13). Left-in-bank is intentionally NOT
// part of the series (see specs/features/desktop-dashboard.md — Earned/Spent/Invested).

export interface TrendPoint {
  month: string; // 'YYYY-MM-01'
  earned: number;
  spent: number;
  invested: number;
}

// Shift a 'YYYY-MM-01' key by delta months (server-side; no Date-util import to keep
// lib/api free of feature imports). Uses UTC to stay stable regardless of TZ.
const shiftMonthKey = (key: string, delta: number): string => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

/**
 * Build an ascending list of `months` month-keys ending at (and including) `anchor`.
 * e.g. anchor='2026-07-01', months=6 → ['2026-02-01', …, '2026-07-01'].
 */
export const buildMonthWindow = (anchor: string, months: number): string[] => {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    keys.push(shiftMonthKey(anchor, -i));
  }
  return keys;
};

/**
 * Load the Earned/Spent/Invested trend across a window of `months` ending at
 * `anchorMonth`. Four range-scoped queries (credits/expenses/investments/paid-bills),
 * grouped in JS. Missing months are zero-filled. Window is bounded (≤12) so the
 * scanned range stays small.
 */
export const loadTrendData = async (
  supabase: SupabaseClient,
  userId: string,
  anchorMonth: string,
  months: number
): Promise<TrendPoint[]> => {
  const window = buildMonthWindow(anchorMonth, months);
  const from = window[0];
  const to = anchorMonth;

  const [creditsRes, expensesRes, investmentsRes, paidBillsRes] = await Promise.all([
    supabase
      .from("credits")
      .select("amount, month")
      .eq("user_id", userId)
      .gte("month", from)
      .lte("month", to),
    supabase
      .from("expenses")
      .select("amount, month")
      .eq("user_id", userId)
      .gte("month", from)
      .lte("month", to),
    supabase
      .from("investments")
      .select("amount, month")
      .eq("user_id", userId)
      .gte("month", from)
      .lte("month", to),
    supabase
      .from("bills")
      .select("amount, month")
      .eq("user_id", userId)
      .eq("paid", true)
      .gte("month", from)
      .lte("month", to),
  ]);

  // Seed every month in the window at zero so gaps render as flat points, not holes.
  const byMonth = new Map<string, TrendPoint>(
    window.map((m) => [m, { month: m, earned: 0, spent: 0, invested: 0 }])
  );

  const add = (
    rows: { amount: number; month: string }[] | null,
    field: "earned" | "spent" | "invested"
  ) => {
    for (const row of rows ?? []) {
      const point = byMonth.get(row.month);
      if (point) point[field] += Number(row.amount);
    }
  };

  add(creditsRes.data, "earned");
  add(expensesRes.data, "spent");
  add(paidBillsRes.data, "spent"); // paid bills count toward spent (D14)
  add(investmentsRes.data, "invested");

  return window.map((m) => byMonth.get(m)!);
};
