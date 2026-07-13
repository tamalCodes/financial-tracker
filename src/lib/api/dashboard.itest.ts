import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cumulativeLeftInBank } from "@/lib/api/dashboard";

/**
 * Live-DB integration (Track B #6). Proves the real schema + RLS + opening-balance
 * trigger against a local Supabase. Run:
 *   npm run db:start            # supabase start (Docker)
 *   npm run db:reset            # apply migrations + seed
 *   npm run test:integration
 *
 * Self-skips unless SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY are set
 * (the local keys are printed by `supabase start`).
 */
const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = Boolean(URL && ANON && SERVICE);

const stamp = Date.now();
const userA = { email: `a-${stamp}@example.com`, password: "secret123!" };
const userB = { email: `b-${stamp}@example.com`, password: "secret123!" };
const MONTH = "2026-06-01";

let admin: SupabaseClient;
let idA = "";
let idB = "";

async function signedInClient(email: string, password: string) {
  const c = createClient(URL!, ANON!);
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

describe.skipIf(!ready)("dashboard integration (live DB + RLS)", () => {
  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Opening balance flows through signup metadata → handle_new_user trigger.
    const a = await admin.auth.admin.createUser({
      email: userA.email,
      password: userA.password,
      email_confirm: true,
      user_metadata: { opening_balance: 70000 },
    });
    if (a.error) throw a.error;
    idA = a.data.user.id;

    const b = await admin.auth.admin.createUser({
      email: userB.email,
      password: userB.password,
      email_confirm: true,
      user_metadata: { opening_balance: 0 },
    });
    if (b.error) throw b.error;
    idB = b.data.user.id;

    // Seed user A's money rows via the service client (bypasses RLS).
    await admin.from("credits").insert({ user_id: idA, month: MONTH, description: "salary", amount: 50000 });
    await admin.from("expenses").insert({ user_id: idA, month: MONTH, description: "lunch", amount: 8000, category: "food" });
    await admin.from("bills").insert({ user_id: idA, month: MONTH, name: "elec", amount: 1000, paid: true });
  });

  afterAll(async () => {
    if (admin && idA) await admin.auth.admin.deleteUser(idA);
    if (admin && idB) await admin.auth.admin.deleteUser(idB);
  });

  it("trigger seeds profiles.opening_balance from signup metadata", async () => {
    const { data, error } = await admin
      .from("profiles")
      .select("opening_balance")
      .eq("user_id", idA)
      .single();
    expect(error).toBeNull();
    expect(Number(data?.opening_balance)).toBe(70000);
  });

  it("leftInBank = opening_balance + earned − (expenses + paid bills) for the owner", async () => {
    const c = await signedInClient(userA.email, userA.password);
    // 70000 + 50000 − (8000 + 1000) = 111000
    const left = await cumulativeLeftInBank(c as never, idA, MONTH);
    expect(left).toBe(111000);
  });

  it("RLS isolates users — B cannot read A's rows", async () => {
    const c = await signedInClient(userB.email, userB.password);
    const { data } = await c.from("credits").select("amount").eq("user_id", idA);
    expect(data ?? []).toHaveLength(0);
  });
});
