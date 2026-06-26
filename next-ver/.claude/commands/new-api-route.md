---
description: Generate an API route.ts skeleton wired to CONVENTIONS (auth, rate limit, validation, balance delta).
argument-hint: <resource-name>
---

Create `src/app/api/$ARGUMENTS/route.ts` for the next-ver app. First read
`specs/CONVENTIONS.md` and the reference route `src/app/api/credits/route.ts`. Match it exactly.

Emit handlers the feature needs (POST/PUT/DELETE/GET), each following this skeleton — replace
`<resource>`, table name, select columns, and the `applyBalanceDelta` sign (CONVENTIONS §4):

```ts
import { applyBalanceDelta } from "@/lib/api/balances";
import { rateLimit } from "@/lib/api/rateLimit";
import { createSupabaseServerClient } from "@/lib/supabase/cookies";
import { requireUser } from "@/lib/supabase/auth";
import { NextResponse } from "next/server";

const tooManyRequests = (resetMs: number) =>
  NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(resetMs / 1000)) } }
  );

const handleError = (error: unknown) => {
  if (error instanceof NextResponse) return error; // 401 from requireUser
  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
};

export async function POST(request: Request) {
  const limit = rateLimit(request, "<resource>:post", { limit: 30, windowMs: 60_000 });
  if (!limit.ok) return tooManyRequests(limit.resetMs);

  const payload = await request.json();
  const { currentMonth, description, amount, carry_forward } = payload ?? {};
  if (!currentMonth || !description || amount === undefined) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await requireUser(supabase);

    const { data: inserted, error } = await supabase
      .from("<resource>")
      .insert({ user_id: userId, month: currentMonth, description, amount, carry_forward: Boolean(carry_forward) })
      .select("id, description, amount, created_at, carry_forward")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const balance = await applyBalanceDelta(supabase, userId, currentMonth, Number(amount)); // sign per §4
    return NextResponse.json({ item: inserted, balance });
  } catch (error) {
    return handleError(error);
  }
}
```

For PUT/DELETE: re-fetch the row scoped by `user_id` + `id` (`.maybeSingle()`) → 404 if
missing, read its `amount`/`month`, then `applyBalanceDelta` with the reversing sign.

If the resource doesn't affect balances, drop the `applyBalanceDelta` lines. Update
`specs/DATA_MODEL.md` if you introduce a table/column. Then run `graphify update .`.
