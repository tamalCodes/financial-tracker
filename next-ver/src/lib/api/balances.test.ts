import { describe, expect, it } from "vitest";
import { applyBalanceDelta, calculateClosingBalance } from "@/lib/api/balances";
import type { Credit, Expense, Investment } from "@/features/dashboard/types/types";

const credit = (amount: number): Credit => ({
  id: "c",
  description: "x",
  amount,
  created_at: "",
});
const expense = (amount: number): Expense => ({
  id: "e",
  description: "x",
  amount,
  created_at: "",
});
const investment = (amount: number): Investment => ({
  id: "i",
  description: "x",
  amount,
  is_active: true,
  start_month: "2026-06-01",
});

describe("calculateClosingBalance — the invariant", () => {
  it("closing = starting + Σcredits − Σexpenses − Σinvestments", () => {
    const closing = calculateClosingBalance(
      1000,
      [credit(500), credit(200)],
      [expense(300)],
      [investment(100)]
    );
    expect(closing).toBe(1000 + 700 - 300 - 100); // 1300
  });

  it("empty lists return the starting balance", () => {
    expect(calculateClosingBalance(750, [], [], [])).toBe(750);
  });

  it("coerces string amounts via Number()", () => {
    const closing = calculateClosingBalance(
      0,
      [{ ...credit(0), amount: "50" as unknown as number }],
      [],
      []
    );
    expect(closing).toBe(50);
  });
});

/**
 * Minimal chainable Supabase mock for monthly_balances:
 *   select(...).eq(...).eq(...).maybeSingle()  → read
 *   update(...).eq(...).eq(...).select(...).maybeSingle() → write
 */
function mockSupabase(existing: { starting_balance: number; closing_balance: number } | null) {
  let updatedPayload: Record<string, number> | null = null;
  const api = {
    from() {
      return {
        select() {
          return this;
        },
        update(payload: Record<string, number>) {
          updatedPayload = payload;
          return this;
        },
        eq() {
          return this;
        },
        maybeSingle() {
          // First call (read) returns existing; calls after an update return the new row.
          if (updatedPayload) {
            return Promise.resolve({
              data: { ...existing, ...updatedPayload },
              error: null,
            });
          }
          return Promise.resolve({ data: existing, error: null });
        },
      };
    },
    get updatedPayload() {
      return updatedPayload;
    },
  };
  return api;
}

describe("applyBalanceDelta", () => {
  it("adds a positive delta to closing_balance (e.g. credit create)", async () => {
    const supabase = mockSupabase({ starting_balance: 1000, closing_balance: 1000 });
    const result = await applyBalanceDelta(
      supabase as never,
      "user-1",
      "2026-06-01",
      250
    );
    expect(result?.closing_balance).toBe(1250);
  });

  it("subtracts a negative delta (e.g. expense/investment create)", async () => {
    const supabase = mockSupabase({ starting_balance: 1000, closing_balance: 1000 });
    const result = await applyBalanceDelta(
      supabase as never,
      "user-1",
      "2026-06-01",
      -400
    );
    expect(result?.closing_balance).toBe(600);
  });

  it("returns null (no-op) when no balance row exists for the month", async () => {
    const supabase = mockSupabase(null);
    const result = await applyBalanceDelta(
      supabase as never,
      "user-1",
      "2026-06-01",
      999
    );
    expect(result).toBeNull();
  });
});
