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

## D8 — Shared UI primitives over per-modal Tailwind (`features/shared/ui/`)
The four transaction modals had each grown their own styling (different heading sizes,
`gap-10` vs `gap-5`, raw checkbox vs toggle, some missing `max-w`/safe-area, `z-50` losing to
app chrome). Unified onto `Modal` / `Field` / `TextField` / `Button` / `ToggleCard`. New dialogs
reuse these — see DESIGN_SYSTEM.md. Trade-off: one more indirection layer, but the visual
language now lives in one place instead of being copy-pasted (and re-drifting) per form.

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
