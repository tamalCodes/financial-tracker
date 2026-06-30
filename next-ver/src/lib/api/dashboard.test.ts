import { describe, expect, it } from "vitest";
import { cumulativeLeftInBank, loadDashboardData } from "@/lib/api/dashboard";

/**
 * Minimal thenable Supabase mock. Each `from(table)` returns a chainable builder
 * (select/order/eq/lte/maybeSingle) that resolves to the table's rows filtered by the
 * recorded eq/lte predicates. user_id is ignored (single-user fixtures).
 */
type Row = Record<string, unknown>;
function mockSupabase(data: Record<string, Row[]>) {
  return {
    from(table: string) {
      const rows = data[table] ?? [];
      const filters: [string, string, unknown][] = [];
      const apply = () =>
        rows.filter((r) =>
          filters.every(([op, col, val]) => {
            if (col === "user_id") return true;
            if (op === "eq") return r[col] === val;
            if (op === "lte") return String(r[col]) <= String(val);
            return true;
          })
        );
      const builder = {
        select: () => builder,
        order: () => builder,
        range: () => builder,
        eq: (col: string, val: unknown) => {
          filters.push(["eq", col, val]);
          return builder;
        },
        lte: (col: string, val: unknown) => {
          filters.push(["lte", col, val]);
          return builder;
        },
        maybeSingle: () =>
          Promise.resolve({ data: apply()[0] ?? null, error: null }),
        then: (resolve: (r: { data: Row[]; error: null }) => void) => {
          resolve({ data: apply(), error: null });
        },
      };
      return builder;
    },
  };
}

const MAY = "2026-05-01";
const JUNE = "2026-06-01";

const fixtures = {
  credits: [
    { id: "c1", month: MAY, amount: 20000, description: "salary", created_at: "" },
    { id: "c2", month: JUNE, amount: 30000, description: "salary", created_at: "" },
  ],
  expenses: [
    { id: "e1", month: MAY, amount: 5000, category: "food", description: "x", created_at: "", tags: [] },
    { id: "e2", month: JUNE, amount: 8000, category: "food", description: "y", created_at: "", tags: [] },
  ],
  investments: [
    { id: "i1", month: MAY, amount: 2000, description: "sip", created_at: "" },
    { id: "i2", month: JUNE, amount: 3000, description: "sip", created_at: "" },
  ],
  bills: [
    { id: "b1", month: MAY, amount: 500, paid: true, name: "gas", due_date: "18 May", created_at: "" },
    { id: "b2", month: JUNE, amount: 1000, paid: true, name: "elec", due_date: "05 Jun", created_at: "" },
    { id: "b3", month: JUNE, amount: 4000, paid: false, name: "cc", due_date: "25 Jun", created_at: "" },
  ],
  // Opening bank balance set once at signup (D-A). Folded into Left-in-bank, not income.
  profiles: [{ user_id: "u1", opening_balance: 70000, created_at: "" }],
};

describe("cumulativeLeftInBank", () => {
  it("opening balance + earned − (expenses + paid bills) − invested across all months ≤ current", async () => {
    const db = mockSupabase(fixtures);
    // June: opening 70000 + earned 50000 − (expenses 13000 + paid bills 1500) − invested 5000 = 100500
    const left = await cumulativeLeftInBank(db as never, "u1", JUNE);
    expect(left).toBe(100500);
  });

  it("excludes future months (May view never sees June rows)", async () => {
    const db = mockSupabase(fixtures);
    // May: opening 70000 + 20000 − (5000 + 500) − 2000 = 82500
    const left = await cumulativeLeftInBank(db as never, "u1", MAY);
    expect(left).toBe(82500);
  });

  it("unpaid bills do not reduce the balance", async () => {
    const db = mockSupabase({ ...fixtures, bills: [fixtures.bills[2]] }); // only the unpaid cc
    const left = await cumulativeLeftInBank(db as never, "u1", JUNE);
    // opening 70000 + earned 50000 − expenses 13000 − invested 5000 = 102000 (no bill subtracted)
    expect(left).toBe(102000);
  });

  it("opening balance defaults to 0 when the user has no profile row", async () => {
    const db = mockSupabase({ ...fixtures, profiles: [] });
    const left = await cumulativeLeftInBank(db as never, "u1", JUNE);
    // no opening balance: 50000 − 14500 − 5000 = 30500
    expect(left).toBe(30500);
  });
});

describe("loadDashboardData — per-month summary", () => {
  it("tiles reflect the current month only; spent includes paid bills", async () => {
    const db = mockSupabase(fixtures);
    const { summary, bills } = await loadDashboardData(db as never, "u1", JUNE);
    expect(summary.earned).toBe(30000); // June credits only (opening balance excluded — not income)
    expect(summary.invested).toBe(3000); // June investments only
    expect(summary.spent).toBe(9000); // June expense 8000 + June paid bill 1000
    expect(summary.leftInBank).toBe(100500); // cumulative incl. 70000 opening balance
    expect(bills).toHaveLength(2); // both June bills returned
  });
});
