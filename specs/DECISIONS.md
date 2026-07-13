# DECISIONS

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

## D8 — Retire unused shared UI primitive layer
An earlier pass introduced `features/shared/ui/*` wrappers for modal/form styling, but the live dashboard moved to bespoke high-fidelity sheets (`AddSheet`, `EditSheet`, and related mobile components).
The wrapper layer became dead code and a misleading spec target.
Decision: delete unused wrappers and keep visual consistency through `DESIGN_SYSTEM.md` plus existing live sheet patterns.
Add a shared primitive only after repeated live usage proves the abstraction is worth it.

## D9 — AmountInput totals instantly, no artificial delay
The amount field previously played a ~1.75s fake "thinking" shimmer + "Adding it up…" beat
before resolving `900+300`. It read as sluggish for a field the user wants answered now. Removed
the delay/shimmer (and the dead `ai-shimmer`/`ai-thinking` CSS); it now totals on blur
immediately, keeping only a quiet inline hint. Arithmetic eval (`evaluateExpression`) unchanged.

## D10 — AmountInput: fast, focus-independent auto-resolve (supersedes D9's blur-only)
D9 fixed the *sluggishness* but left totaling **blur-only** — you couldn't see `900+300` become
`1200` without leaving the field. D10 brings back an auto-resolve that fires **while focused**,
but fast and honest (not D9's ~1.75s fake "thinking"):
- A `RESOLVE_DELAY` (600ms) debounce, re-armed per keystroke, only triggers when `isCalculation`,
  `evaluateExpression` is non-null, the value isn't mid-token (no trailing operator), and the
  result differs from the current value — so it never flashes errors on in-progress input.
- Phase A (~350ms): indigo shimmer sweep + `aria-live` "Calculating…" microcopy in the freed
  status slot. Phase B: `requestAnimationFrame` count-up tween to the result (~250ms ease-out,
  `tabular-nums`) + ~140ms settle glow; the caret returns to the end. **Calc + reveal ≈ 740ms.**
- `prefers-reduced-motion: reduce` skips the animation and sets the value directly. Blur still
  resolves immediately (the existing path is kept). Timers/RAF are cleaned up on unmount and on
  every value change; the parent sees a **single** `onChange` (the committed result), guarded by a
  `committingRef` so the value-change effect doesn't tear down the closing glow.
- The "Calculating…" microcopy uses `text-indigo-600` (not `-500`) to clear WCAG AA 4.5:1 on white.
- Also removed the focus **ring** (`ring-4 ring-indigo-500/10`) from `AmountInput` *and* `TextField`
  — it read as a second outer border. Focus is now a single `border-indigo-400` + `bg-white`. See
  the DESIGN_SYSTEM "Field focus" token row.

## D11 — Color is glass, not paint; indigo is the only solid accent
Category tags (`TagInput`) first shipped as **opaque saturated gradients with white text**
(deep orange/blue/pink). The user rejected this twice — they wanted **glassmorphism**:
semi-transparent, frosted, see-through. So:
- Tags now use the **Glass treatment** (DESIGN_SYSTEM §2): a translucent hue tint
  (`rgb(h / 0.15–0.30)`) + `backdrop-filter: blur(14px) saturate(1.7)` + a translucent colored
  border + a top white sheen, with **deep-family text** (700/800) for WCAG AA — never white-on-fill.
- **Indigo (`indigo-500/600`) is the single solid brand accent.** No second solid brand hue;
  anything "colorful" goes through glass. Decided with the user (palette = indigo-only).
- Default frost intensity is the **stronger** preset (blur 14px), per user preference.
- Tag set trimmed to **Food / Bills / Shopping** (dropped Transport/Health/Subscription — too many).
This is now a house rule, captured in DESIGN_SYSTEM Principles §0 so design skills inherit it.

## D12 — Flat focus: no box-shadow / settle glow on inputs
D10 removed the focus *ring*; D11's AmountInput still ended its reveal with a ~140ms indigo
**settle glow** (`box-shadow: 0 0 0 3px indigo/0.18`). The user flagged that residual halo and asked
for it gone. Removed the settle phase entirely — Phase B now commits the result and returns the
caret with **no glow**. Inputs focus by **border color only** (`border-indigo-400` + `bg-white`),
no `box-shadow`/ring/glow anywhere. Also dropped the malformed `transition-[colors,box-shadow]`
(invalid property list) back to `transition-colors`. New house rule in DESIGN_SYSTEM Principle §0.5.
Calc + reveal is now ≈ 600ms (350ms calc + 250ms count-up).

## D13 — Cumulative "Left in bank" replaces starting/closing balance (mobile redesign)
The per-month `monthly_balances` (starting/closing, `applyBalanceDelta`, self-heal, rollover
seed, carry-forward of credits/expenses) was **removed**. Balance is now a single **cumulative**
figure computed on read: `leftInBank(month) = Σ_{m ≤ month}(earned_m − spent_m − invested_m)`.
The three HeroBalance tiles show only the current month. Rationale (owner): the user wants a
running bank balance that piles up across months, with per-month earned/spent/invested resetting —
not a reconciled opening/closing ledger. `monthly_balances` is kept but deprecated (D7 risk moot
for it now). Supersedes **D1** (incremental balance) and **D4** (carry-forward copies). See
DATA_MODEL.md money model.

## D14 — Bills are a separate ledger but paid bills count toward spend
`bills` is its own table, not expenses. Paying a bill does **not** create an expense row and bills
never appear in Recent payments — but a **paid** bill is added to `spent_m` (and thus reduces
Left-in-bank). Unpaid bills are future obligations and excluded. Owner decision: bills should be
tracked distinctly (their own card, Pay action, "Paid this month") yet still affect the month's
real spend. No overdue state (the cloth handoff removed it).

## D15 — Investments split into per-month FLOW vs manual PORTFOLIO; recurring model removed
Two distinct concepts now:
- **Flow** (`investments` table, simplified): plain per-month rows that drive the "Invested" tile +
  Left-in-bank. The old recurring model (D3: `start_month` + `lte` filter + `is_active` soft delete +
  `carry_forward`) was **removed** — manual per-month entries, hard delete. Supersedes **D3**.
- **Portfolio panel** (`holdings`, `sips`, `portfolio_totals`): manual, display-only reference (FD
  rate/maturity, mutual-fund current value, static SIP monthly/paid, a manual portfolio number).
  Does **not** affect the money model.
Owner decision: no automation/valuation feeds exist, so everything is manual; the panel is
reference, the tile is cash flow. Open sub-decision (assumed NO): SIP payments do not feed the
monthly Invested tile — log them as flow entries if that changes.

## D16 — One-time signup `opening_balance` seeds Left-in-bank (not income)
Migration `002_profiles_opening_balance.sql` adds `profiles.opening_balance` — the bank balance
the user has *before* any tracked month. `leftInBank` starts from it:
`leftInBank(month) = opening_balance + Σ_{m ≤ month}(earned − spent − paidBills − invested)`.
It is a **starting point, not income** — it never feeds the per-month `earned` tile, only the
cumulative bank figure. Captured once at signup; edited via the profile, not a monthly mutation.

## D17 — EMIs are pre-created installment rows on the `bills` ledger (not a new table)
An EMI is modelled as N normal `bills` rows — one per month from `currentMonth`, all sharing an
`emi_id` (uuid), with `emi_seq` (1-based index), `emi_months` (duration), `emi_total` (loan total,
display-only). `POST /api/emis` expands the EMI into those rows in one insert; **paying an
installment is a normal `PATCH /api/bills` on that month's row** — no special path. This reuses the
whole bills money model (D14: a paid installment counts toward that month's spend) for free. One-off
bills leave every `emi_*` column null. `GET /api/emis` rolls the rows up per `emi_id` into progress
(paid/remaining count + amount). Alternative rejected: a separate `emis` table with a payment
schedule — would duplicate the bills pay/spend logic. `monthly × months` may exceed `emi_total`
(interest), so the total is display-only, never summed into spend.

## D18 — Single free-form `tag` on expenses + tap-to-edit; legacy `tags[]` never shipped
The mobile Recent-payments row is tappable → opens `EditSheet` (amount, title/description, one
free-form `tag`, category). Migration `004_expense_tag.sql` adds a **single nullable `tag` text**
column — deliberately *not* the legacy `tags text[]` (which was designed but never migrated to the
live DB; `schemas.ts` still declares `tags` for back-compat but the route neither selects nor writes
it). One tag keeps the edit UI a single field. Empty string clears it (→ null). Editing an expense
is `PUT /api/expenses`; it has **no balance side-effect** (D13 — spend is computed on read).

## D19 — Security headers (CSP + hardening) via `next.config` `headers()`
`next.config.ts` sends a Content-Security-Policy plus HSTS, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a locked
`Permissions-Policy` on every route. CSP uses `'unsafe-inline'` for script/style because the App
Router injects inline bootstrap/hydration scripts and Tailwind emits inline styles — a nonce-based
middleware is the intended follow-up. Dev additionally allows `'unsafe-eval'` + `ws:`/`wss:` for HMR
(never shipped to prod, gated on `NODE_ENV`). `connect-src` allowlists the Supabase origin as
defense-in-depth even though Supabase is called server-side only. Set at the config layer (not
middleware) so it applies uniformly and survives static/edge responses.

## D20 — Recent payments are paginated; totals come from an amounts-only sweep
`/api/dashboard` returns only the first page of expenses (`EXPENSES_PAGE_SIZE`, newest-first);
pages 2+ load lazily via `GET /api/expenses?page=`. The Spent tile and "N this month" line must
reflect the **whole month**, not the page — so `loadDashboardData` also runs a separate
amounts-only sweep of the month to produce `expensesTotal` (count) and `loggedTotal` (Σ),
independent of the page window. Chosen over fetching every row: the list can grow unbounded but the
tiles need only aggregates.

## D21 — RLS added as defense-in-depth; query-layer ownership stays primary
Migration `003_rls.sql` enables Postgres row-level security on the user tables. This does **not**
change D-era practice: every query still filters `.eq("user_id", userId)` in code (ARCHITECTURE
step 4). RLS is a second wall in case a query ever forgets the filter — not a replacement for it.

## D22 — SIP plans have explicit monthly recording; bank debit is optional
Owner needs this month's SIP total, selected paid funds, and a choice for whether money has left
the bank. `sip_payments` allows one payment per SIP/month and a DB transaction updates plan totals,
matching mutual-fund holding, and portfolio value together. **Debit balance** defaults on and writes
one investment-flow row, reducing Left-in-bank. Turning it off retains portfolio updates without
claiming bank debit. This resolves D15's open SIP sub-decision.
