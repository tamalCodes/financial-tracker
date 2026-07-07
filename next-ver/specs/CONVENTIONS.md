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
import { handleError } from "@/lib/api/responses";

try {
  const supabase = await createSupabaseServerClient();
  const { userId } = await requireUser(supabase);
  // ...work scoped by userId...
} catch (e) {
  return handleError(e); // re-returns the 401 from requireUser; else 400 + message
}
```

`handleError` / `tooManyRequests` live in `src/lib/api/responses.ts` — import them, don't
re-define. For read endpoints pass `handleError(e, 500)` so server errors aren't masked as 400.

> All data routes (`credits`, `expenses`, `investments`, `bills`, `emis`, `holdings`, `sips`,
> `portfolio`, `dashboard`) and all auth routes follow this pattern. (`balances` was removed —
> D13.) Keep it that way.

## 2. Error / response shapes — `src/app/api/*/route.ts`
- Error: `NextResponse.json({ error: "<msg>" }, { status })`.
- Success (mutation): `NextResponse.json({ item })`; delete: `{ ok: true }`. **No `balance`
  object** — removed with `monthly_balances` (DECISIONS D13). EMI create returns
  `{ emi_id, installments }` (see [features/bills.md](./features/bills.md)).
- Status codes: **400** missing field / insert error / generic mutation failure ·
  **401** unauthorized · **404** row not found (after a user-scoped fetch) ·
  **429** rate-limited · **500** unexpected (e.g. dashboard GET catch-all).

## 3. Rate limiting — `src/lib/api/rateLimit.ts`, `src/app/api/auth/login/route.ts`
Applied to every route as the first lines of the handler (before body parse):

```ts
const limit = rateLimit(request, "credits:post", { limit: 30, windowMs: 60_000 });
if (!limit.ok) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetMs / 1000)) } }
  );
}
```
Limits in use: login 10, signup 6, logout 30, me 60, dashboard 60, all mutations 30 (per 60s). In-memory
Map keyed by `<prefix>:<client-ip>` — resets on server restart; fine for a single instance.

## 4. No balance side-effects — computed on read (DECISIONS D13)
**Removed.** Mutations no longer touch any balance row. `monthly_balances`,
`applyBalanceDelta`, `updateClosingBalance`, and `src/lib/api/balances.ts` are gone. "Left in
bank" + the per-month Earned/Spent/Invested tiles are computed on read in
`loadDashboardData` (`src/lib/api/dashboard.ts`) — cumulative across months, seeded by
`profiles.opening_balance` (D16). See DATA_MODEL money model. A create/update/delete just
inserts/updates/deletes the row (user-scoped) and returns `{ item }` / `{ ok: true }`.

## 5. user_id scoping — every query
Always `.eq("user_id", userId)` on select/update/delete — ownership is enforced in the query.
**RLS** is also enabled (migration `003_rls`) as defense-in-depth (D21), but code never relies
on it alone; the `.eq` filter is still mandatory. Ref: `credits/route.ts` PUT/DELETE.

## 6. Validation — zod (`src/lib/api/schemas.ts`)
JSON bodies are validated with a zod schema via `validate(schema, data)`, which throws a
`400 { error: "Missing or invalid fields." }` on failure (caught by `handleError`). Call it
first inside the try block:

```ts
import { mutationCreateSchema, validate } from "@/lib/api/schemas";

const { currentMonth, description, amount, carry_forward } = validate(
  mutationCreateSchema,
  await request.json()
);
```
Reusable schemas: `mutationCreateSchema` (POST credit/expense/investment),
`mutationUpdateSchema` (PUT credit/expense), `startingBalanceSchema` (balances). Add a new
schema here rather than hand-rolling `if (!x)` checks. `amount`/`startingBalance` are
`z.coerce.number()` + finite — already numeric after validate (no extra `Number(...)` needed,
though existing `Number(...)` calls remain harmless).

Query params (DELETE `?id=`, dashboard `?month=`) are still checked inline →
`400 { error: "Missing id." }` / `"Missing month."` (not worth a schema).

## 7. Style
- **Imports**: `@/...` absolute only. Order seen: lib helpers, supabase clients, `next/server`.
- **Files**: API routes are `route.ts` exporting `GET/POST/PUT/DELETE`. Features live under
  `src/features/<feature>/{components,hooks,types,utils}`.
- **Client components**: top-line `"use client"` (hooks, context, forms). RSC by default.
- **Month key format**: `YYYY-MM-01` (string, day always `01`). Helpers in
  `features/dashboard/utils/dates.ts` (`formatMonthKey`, `parseMonthKey`, `shiftMonthKey`).
- **Locale**: dates/currency formatted `en-IN` (₹). Use the existing feature-local formatting helpers.

## 8. UI — existing dashboard patterns
Do not add new shared UI abstractions unless two or more live components actually use them.
For dialogs and sheets, copy the current `AddSheet` / `EditSheet` structure and token usage rather than reviving unused wrapper components.
Tokens and the canonical visual language live in **DESIGN_SYSTEM.md**.
Read it before adding a dialog.
