# CONVENTIONS — next-ver

Copy-pasteable rules derived from real code. Cited file = where the pattern lives.
The canonical reference route is `src/app/api/credits/route.ts` (refactored to all rules below).

## 1. Auth guard — use `requireUser` (standard)
The old block (`getUserFromCookies` → fallback `supabase.auth.getUser()` → 401) was
duplicated in every data route. It is now extracted into `requireUser(supabase)` in
`src/lib/supabase/auth.ts`. **All new routes use it.**

`requireUser` resolves the local JWT cookie first (`getUserFromCookies`), falls back to
`supabase.auth.getUser()`, and **throws a 401 `NextResponse`** if neither yields a user.
So the handler body is wrapped in `try/catch`, and the catch re-returns that response:

```ts
import { requireUser } from "@/lib/supabase/auth";

try {
  const supabase = await createSupabaseServerClient();
  const { userId } = await requireUser(supabase);
  // ...work scoped by userId...
} catch (e) {
  if (e instanceof NextResponse) return e; // the 401 thrown by requireUser
  const message = e instanceof Error ? e.message : "Request failed.";
  return NextResponse.json({ error: message }, { status: 400 });
}
```

> Legacy routes (`expenses`, `investments`, `dashboard`, `balances`) still inline the old
> block. Migrate them to `requireUser` when you touch them.

## 2. Error / response shapes — `src/app/api/*/route.ts`
- Error: `NextResponse.json({ error: "<msg>" }, { status })`.
- Success (mutation): `NextResponse.json({ item, balance })`; delete: `{ ok: true, balance }`.
- Status codes: **400** missing field / insert error / generic mutation failure ·
  **401** unauthorized · **404** row not found (after a user-scoped fetch) ·
  **429** rate-limited · **500** unexpected (e.g. dashboard GET catch-all).

## 3. Rate limiting — `src/lib/api/rateLimit.ts`, `src/app/api/auth/login/route.ts`
Historically applied only to `/api/auth/*`. **New routes SHOULD apply it** as the first
lines of the handler (before body parse):

```ts
const limit = rateLimit(request, "credits:post", { limit: 30, windowMs: 60_000 });
if (!limit.ok) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
  );
}
```
Limits seen: login 10, signup 6, logout 30, me 60, credits 30 (per 60s window). In-memory
Map keyed by `<prefix>:<client-ip>` — resets on server restart; fine for a single instance.

## 4. Balance-delta rule — `src/lib/api/balances.ts`, `src/app/api/credits/route.ts`
Every create/update/delete of a credit/expense/investment MUST call `applyBalanceDelta`
so `monthly_balances.closing_balance` stays correct. Signs:

| op | credit | expense | investment |
|----|--------|---------|------------|
| create | `+amount` | `-amount` | `-amount` |
| update (PUT) | `newAmt − oldAmt` | `oldAmt − newAmt` | (no PUT today) |
| delete | `-amount` | `+amount` | `+amount` (soft delete: set `is_active:false`) |

For update/delete: re-fetch the row (scoped by `user_id` + `id`, `.maybeSingle()`) to read
its `amount`/`month` (`start_month` for investments) before computing the reversing delta.
`applyBalanceDelta` no-ops (returns `null`) if no balance row exists for that month.

When the set of credits/expenses/investments is recomputed wholesale (starting-balance
edits), use `updateClosingBalance(...)` instead — see `src/app/api/balances/route.ts`.

## 5. user_id scoping — every query
Always `.eq("user_id", userId)` on select/update/delete. There is no row-level security
assumed in code — ownership is enforced in the query. Ref: `credits/route.ts` PUT/DELETE.

## 6. Validation
- Validate required fields immediately, before any DB call → `400 { error: "Missing fields." }`.
  POST/PUT read JSON body; DELETE reads `id` from `searchParams` → `400 { error: "Missing id." }`.
- Coerce amounts with `Number(...)`, booleans with `Boolean(...)`.

## 7. Style
- **Imports**: `@/...` absolute only. Order seen: lib helpers, supabase clients, `next/server`.
- **Files**: API routes are `route.ts` exporting `GET/POST/PUT/DELETE`. Features live under
  `src/features/<feature>/{components,hooks,types,utils}`.
- **Client components**: top-line `"use client"` (hooks, context, forms). RSC by default.
- **Month key format**: `YYYY-MM-01` (string, day always `01`). Helpers in
  `features/dashboard/utils/dates.ts` (`formatMonthKey`, `parseMonthKey`, `shiftMonthKey`).
- **Locale**: dates/currency formatted `en-IN` (₹). See `utils/format.ts`.
