# DECISIONS — next-ver

The *why* behind non-obvious choices. Read before "improving" something that looks odd — it
may be deliberate. Append new entries; don't rewrite history.

## D1 — Incremental balance (`applyBalanceDelta`) over full recompute
Each mutation nudges `closing_balance` by a signed delta instead of recomputing from all rows.
Cheaper on the hot path (one read + one update vs. fetching every credit/expense/investment).
Safety net: `loadDashboardData` recomputes on read and rewrites if it drifted. Full recompute
(`updateClosingBalance`) is reserved for starting-balance edits where the whole month changes.

## D2 — JWT cookie fast-path (`getUserFromCookies`) before `supabase.auth.getUser()`
`getUserFromCookies` verifies the Supabase access-token cookie locally with `jose` (no network).
`requireUser` tries it first and only falls back to the network `getUser()` if absent/invalid.
Saves a round-trip on every authenticated API call. Requires `SUPABASE_JWT_SECRET` to be set;
without it, the fast path returns null and the fallback handles auth.

## D3 — Investments: soft delete + no row copy on carry-forward
- **Soft delete** (`is_active=false`) instead of row removal: an investment can span many
  months; hard-deleting would lose history and complicate past-month views.
- **Not copied** across months (unlike credits/expenses): a single row with `start_month` +
  `carry_forward` is queried with `lte("start_month", month)`, so one row represents the whole
  recurring series. Credits/expenses instead copy rows forward (D4).

## D4 — Credits/expenses carry-forward copies rows (deduped)
Recurring credits/expenses are *copied* into the next month on load, tagged
`carried_from_month`, deduped by `description|amount`. Chosen so each month's list is
self-contained and individually editable. Dedup prevents duplicates when the dashboard reloads.

## D5 — `requireUser` throws a `NextResponse` (not returns a union)
`requireUser` throws the 401 response; handlers wrap the body in try/catch and `handleError`
re-returns it. Keeps the happy path a single line (`const { userId } = await requireUser(...)`)
with no per-call `if (res instanceof NextResponse)` branch. Trade-off: every route needs a
try/catch (now standard anyway for zod validation + DB errors).

## D6 — In-memory rate limiter (`rateLimit.ts`)
A process-local `Map`, not Redis/Upstash. Simple, zero-dep, fine for a single instance. Resets
on restart and is per-instance (not shared across serverless replicas). Revisit if deployed
multi-instance — swap the Map for a shared store behind the same `rateLimit()` signature.

## D7 — Schema/types are reverse-engineered (`supabase/schema.sql`, `database.types.ts`)
No migrations existed; both files are best-effort from the queries and marked as such. Treat
`supabase gen types` output as the source of truth once available, and replace the hand-written
`Database` type. Until then, column assumptions carry some risk — see DATA_MODEL "_(inferred)_".
