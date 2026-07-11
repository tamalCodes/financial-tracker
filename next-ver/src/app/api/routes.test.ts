import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

/**
 * Route-handler tests (backend hardening, checklist §4).
 * Covers, across the money-model mutation routes:
 *   - ownership scoping  — every update/delete chains `.eq("user_id", userId)`
 *   - validation         — bad/missing body → 400 in the standard shape
 *   - money-model writes — POST inserts a row with user_id + month + amount
 *   - signup             — opening balance upserted to profiles (D-A)
 *   - rate limiting      — exceeding the per-key limit → 429
 *   - auth               — requireUser 401 propagates
 *
 * Supabase + auth are mocked: queries never hit a DB, so ownership is asserted at the
 * query layer (matches DATA_MODEL.md — RLS not enforced; scoping is in the query).
 */

// --- recording Supabase mock ------------------------------------------------
type EqCall = { table: string; op: string; col: string; val: unknown };
type Write = { table: string; op: string; row?: Record<string, unknown> };

let mockClient: ReturnType<typeof makeClient>["client"];
let eqs: EqCall[];
let writes: Write[];
let signUpSpy: ReturnType<typeof vi.fn>;
let signInSpy: ReturnType<typeof vi.fn>;

function makeClient(authUserId: string | null = "user-1") {
  const _eqs: EqCall[] = [];
  const _writes: Write[] = [];
  const from = (table: string) => {
    let op = "select";
    const builder: Record<string, unknown> = {
      insert: (row: Record<string, unknown>) => {
        op = "insert";
        _writes.push({ table, op, row });
        return builder;
      },
      update: (row: Record<string, unknown>) => {
        op = "update";
        _writes.push({ table, op, row });
        return builder;
      },
      upsert: (row: Record<string, unknown>) => {
        op = "upsert";
        _writes.push({ table, op, row });
        return builder;
      },
      delete: () => {
        op = "delete";
        _writes.push({ table, op });
        return builder;
      },
      select: () => builder,
      order: () => builder,
      lte: () => builder,
      eq: (col: string, val: unknown) => {
        _eqs.push({ table, op, col, val });
        return builder;
      },
      single: () => Promise.resolve({ data: { id: "row-1" }, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: (r: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    };
    return builder;
  };
  const signUp = vi.fn(() =>
    Promise.resolve({
      data: { user: authUserId ? { id: authUserId } : null },
      error: null,
    })
  );
  const signInWithPassword = vi.fn(() =>
    Promise.resolve({
      data: { user: authUserId ? { id: authUserId } : null },
      error: null,
    })
  );
  return {
    client: { from, auth: { signUp, signInWithPassword } },
    eqs: _eqs,
    writes: _writes,
    signUp,
    signInWithPassword,
  };
}

vi.mock("@/lib/supabase/cookies", () => ({
  createSupabaseServerClient: () => Promise.resolve(mockClient),
}));

vi.mock("@/lib/supabase/server", () => ({
  get supabaseServer() {
    return mockClient;
  },
}));

const requireUserMock = vi.fn();
vi.mock("@/lib/supabase/auth", () => ({
  requireUser: () => requireUserMock(),
}));

// Imports must follow vi.mock (hoisted, but keep it readable).
import * as expenses from "@/app/api/expenses/route";
import * as credits from "@/app/api/credits/route";
import * as investments from "@/app/api/investments/route";
import * as bills from "@/app/api/bills/route";
import * as signup from "@/app/api/auth/signup/route";
import * as login from "@/app/api/auth/login/route";

const USER = "user-1";

let ipCounter = 0;
const post = (body: unknown, path = "http://t/api") =>
  new Request(path, {
    method: "POST",
    headers: { "x-forwarded-for": `10.0.0.${ipCounter++}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const put = (body: unknown) => {
  const r = post(body);
  return new Request(r.url, { method: "PUT", headers: r.headers, body: JSON.stringify(body) });
};
const del = (id: string) =>
  new Request(`http://t/api?id=${id}`, {
    method: "DELETE",
    headers: { "x-forwarded-for": `10.0.0.${ipCounter++}` },
  });

beforeEach(() => {
  const c = makeClient(USER);
  mockClient = c.client;
  eqs = c.eqs;
  writes = c.writes;
  signUpSpy = c.signUp;
  signInSpy = c.signInWithPassword;
  requireUserMock.mockReset();
  requireUserMock.mockResolvedValue({ userId: USER });
});

describe("ownership scoping — updates/deletes filter by user_id", () => {
  it("expenses PUT scopes to user_id", async () => {
    await expenses.PUT(put({ id: "x", description: "d", amount: 10 }));
    expect(eqs).toContainEqual({ table: "expenses", op: "update", col: "user_id", val: USER });
  });
  it("expenses DELETE scopes to user_id", async () => {
    await expenses.DELETE(del("x"));
    expect(eqs).toContainEqual({ table: "expenses", op: "delete", col: "user_id", val: USER });
  });
  it("credits PUT scopes to user_id", async () => {
    await credits.PUT(put({ id: "x", description: "d", amount: 10 }));
    expect(eqs).toContainEqual({ table: "credits", op: "update", col: "user_id", val: USER });
  });
  it("credits DELETE scopes to user_id", async () => {
    await credits.DELETE(del("x"));
    expect(eqs).toContainEqual({ table: "credits", op: "delete", col: "user_id", val: USER });
  });
  it("investments PUT scopes to user_id", async () => {
    await investments.PUT(put({ id: "x", description: "d", amount: 10 }));
    expect(eqs).toContainEqual({ table: "investments", op: "update", col: "user_id", val: USER });
  });
  it("investments DELETE scopes to user_id", async () => {
    await investments.DELETE(del("x"));
    expect(eqs).toContainEqual({ table: "investments", op: "delete", col: "user_id", val: USER });
  });
  it("bills PATCH scopes to user_id", async () => {
    await bills.PATCH(put({ id: "x", paid: true }));
    expect(eqs).toContainEqual({ table: "bills", op: "update", col: "user_id", val: USER });
  });
  it("bills DELETE scopes to user_id", async () => {
    await bills.DELETE(del("x"));
    expect(eqs).toContainEqual({ table: "bills", op: "delete", col: "user_id", val: USER });
  });
});

describe("validation — bad body → 400", () => {
  it("expenses POST rejects missing amount", async () => {
    const res = await expenses.POST(post({ currentMonth: "2026-06-01", description: "d" }));
    expect(res.status).toBe(400);
  });
  it("credits POST rejects empty description", async () => {
    const res = await credits.POST(post({ currentMonth: "2026-06-01", description: "", amount: 10 }));
    expect(res.status).toBe(400);
  });
  it("bills PATCH rejects non-boolean paid", async () => {
    const res = await bills.PATCH(put({ id: "x", paid: "yes" }));
    expect(res.status).toBe(400);
  });
  it("bills DELETE rejects missing id", async () => {
    const res = await bills.DELETE(
      new Request("http://t/api", { method: "DELETE", headers: { "x-forwarded-for": `10.0.0.${ipCounter++}` } })
    );
    expect(res.status).toBe(400);
  });
});

describe("money-model writes — POST inserts user-scoped per-month row", () => {
  it("expenses POST writes user_id + month + amount", async () => {
    await expenses.POST(post({ currentMonth: "2026-06-01", description: "lunch", amount: 250, category: "food" }));
    const w = writes.find((x) => x.table === "expenses" && x.op === "insert");
    expect(w?.row).toMatchObject({ user_id: USER, month: "2026-06-01", amount: 250 });
  });
  it("credits POST writes user_id + month + amount", async () => {
    await credits.POST(post({ currentMonth: "2026-06-01", description: "salary", amount: 50000 }));
    const w = writes.find((x) => x.table === "credits" && x.op === "insert");
    expect(w?.row).toMatchObject({ user_id: USER, month: "2026-06-01", amount: 50000 });
  });
  it("investments POST writes user_id + month + amount", async () => {
    await investments.POST(post({ currentMonth: "2026-06-01", description: "sip", amount: 3000 }));
    const w = writes.find((x) => x.table === "investments" && x.op === "insert");
    expect(w?.row).toMatchObject({ user_id: USER, month: "2026-06-01", amount: 3000 });
  });
});

describe("signup — opening balance (D-A, via metadata → trigger)", () => {
  it("passes opening_balance to signUp metadata (trigger seeds profiles under RLS)", async () => {
    const res = await signup.POST(
      post({ email: "a@b.com", password: "StrongPass123", fullName: "Ada Lovelace", openingBalance: 70000 })
    );
    expect(res.status).toBe(200);
    expect(signUpSpy).toHaveBeenCalledWith(
      expect.objectContaining({ options: { data: { full_name: "Ada Lovelace", opening_balance: 70000 } } })
    );
  });
  it("requires an opening balance", async () => {
    const res = await signup.POST(
      post({ email: "a@b.com", password: "StrongPass123", fullName: "Ada Lovelace" })
    );
    expect(res.status).toBe(400);
    expect(signUpSpy).not.toHaveBeenCalled();
  });
  it("rejects a negative opening balance", async () => {
    const res = await signup.POST(
      post({ email: "a@b.com", password: "StrongPass123", fullName: "Ada Lovelace", openingBalance: -1 })
    );
    expect(res.status).toBe(400);
    expect(signUpSpy).not.toHaveBeenCalled();
  });
  it("rejects a weak password", async () => {
    const res = await signup.POST(
      post({ email: "a@b.com", password: "password", fullName: "Ada Lovelace", openingBalance: 0 })
    );
    expect(res.status).toBe(400);
    expect(signUpSpy).not.toHaveBeenCalled();
  });
});

describe("login — last login audit", () => {
  it("records profiles.last_login_at after successful password login", async () => {
    const res = await login.POST(post({ email: "a@b.com", password: "secret123" }));
    expect(res.status).toBe(200);
    expect(signInSpy).toHaveBeenCalledWith({ email: "a@b.com", password: "secret123" });

    const w = writes.find((x) => x.table === "profiles" && x.op === "upsert");
    expect(w?.row).toMatchObject({ user_id: USER });
    expect(typeof w?.row?.last_login_at).toBe("string");
    expect(Number.isNaN(Date.parse(w?.row?.last_login_at as string))).toBe(false);
  });
});

describe("rate limiting", () => {
  it("returns 429 once the per-key limit is exceeded for one IP", async () => {
    const ip = "10.9.9.9";
    const body = { currentMonth: "2026-06-01", description: "d", amount: 1 };
    const fire = () =>
      expenses.POST(
        new Request("http://t/api", {
          method: "POST",
          headers: { "x-forwarded-for": ip, "content-type": "application/json" },
          body: JSON.stringify(body),
        })
      );
    let sawLimit = false;
    for (let i = 0; i < 40; i++) {
      const res = await fire();
      if (res.status === 429) {
        sawLimit = true;
        break;
      }
    }
    expect(sawLimit).toBe(true);
  });
});

describe("auth — unauthorized propagates", () => {
  it("expenses POST returns 401 when requireUser throws", async () => {
    requireUserMock.mockRejectedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
    const res = await expenses.POST(post({ currentMonth: "2026-06-01", description: "d", amount: 1 }));
    expect(res.status).toBe(401);
  });
});
