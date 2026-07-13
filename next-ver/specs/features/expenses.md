# Expenses

Reverse-engineered from `src/app/api/expenses/route.ts`, `lib/api/dashboard.ts`,
`lib/api/schemas.ts`, `features/dashboard/mobile/{AddSheet,EditSheet,AmountField,CatPill,Transactions,useFinance}.tsx`.
Post mobile redesign — see DECISIONS D13/D18/D20, DATA_MODEL money model.

## Problem
Users log spending for a month ("Recent payments"). Spend is shown per-month (Spent tile) and
rolled into the cumulative Left-in-bank. **No balance side-effects** — spend is computed on read
(D13); mutations never touch a balance row.

## Data model touched
`expenses`: `id, user_id, month, description, amount, category, tag, created_at`. Deprecated/unused:
`carry_forward, carried_from_month, tags[]` (the array never migrated to the live DB — D18).
- **`category`** ∈ `food | shopping | transport | health | groceries | other` (default `other`) —
  drives the colored pill + AddSheet picker.
- **`tag`** — single nullable free-form label (migration 004), set via the mobile edit modal.
  Empty string clears it (→ null).

## API contract — `/api/expenses`
- **GET** `?month=YYYY-MM-01&page=&pageSize=` — paginated recent payments, newest-first, user-scoped.
  Page 1 also ships inside `/api/dashboard`; this serves 2+ (D20). `page` 1-based, `pageSize`
  defaults to `EXPENSES_PAGE_SIZE`. → `{ items, total }` (`total` = full-month count).
- **POST** — `{ currentMonth, description, amount, category?, tag? }` → `{ item }`.
  `category` defaults to `other`; `tag` stored trimmed or null. **No balance delta.**
- **PUT** — `{ id, description, amount, category?, tag? }`; re-fetch missing → 404. → `{ item }`.
  Powers tap-to-edit (EditSheet). `category` set only if provided; `tag` set/cleared only if the
  key is present in the body. **No balance delta.**
- **DELETE** — `?id=` → hard delete → `{ ok: true }`. **No balance delta.**
- Errors: 400 / 401 / 404 / 429.
- `select`: `"id, description, amount, category, tag, created_at"`.
- Rate limit: `expenses:{get 60, post/put/delete 30}` per 60s. Auth via `requireUser`, all queries
  `.eq("user_id", userId)`.

## No carry-forward
Removed with the redesign (D13). `carry_forward`/`carried_from_month` columns retained but unused;
cumulative Left-in-bank replaces the old copy-forward behavior.

## UI / components (mobile)
- **AddSheet** — expense mode: amount, category picker (6 pills, default Food), note. A **type
  toggle** (Expense / Bill / EMI) can reroute the entry to the bills/EMI ledger instead — see
  [bills.md](./bills.md).
  - **Inline calculator ("AI" math)** — the Amount field accepts an arithmetic expression
    (`900+300`, `900 plus 300`, `×`/`x`/`divided by`…). Extracted to the shared **`AmountField`**
    component (used by AddSheet and EditSheet). It holds the operator-capable draft in local `expr`
    state (the parent `onAmount` only ever receives sanitised digits, so operators never
    round-trip). `evalExpr` parses it with a no-`eval` shunting-yard evaluator. On a complete
    expression the field pauses ~900ms, runs a ~0.75s gold-accent "thinking" state (border glow +
    sweeping shimmer + ✦/pulsing-dots badge), then reveals the result with an easeOutCubic count-up
    + glow pop and pushes the final integer up via `onAmount`. Reports its animating state via
    `onCalcActiveChange` so the parent can disable Save. Optional `prefix` (e.g. `₹`) and
    `placeholder`. Uses the shared brand accent (`--c-accent`, warm gold) per design system — the
    glow/shimmer/badge are all `rgb(var(--c-accent-rgb) / …)`, so they follow the theme, not a hardcoded hue.
    - **Operator bar in the CTA slot (mobile keypad fallback)** — the field keeps
      `inputMode="numeric"`, but mobile numeric keypads don't expose `+ − × ÷`. Rather than a
      separate floating strip, the exported **`OperatorBar`** (glassy accent-translucent row of
      `+ − × ÷`, no "Done" button) **takes over the sheet's primary CTA slot** — the Save / "Add
      expense" button — while the Amount field is focused; blurring swaps the Save button back in.
      `AmountField` is a `forwardRef` exposing an `AmountFieldHandle` (`insertOp`) and reports focus
      via `onFocusChange`; each sheet (AddSheet, EditSheet) holds a ref + `amountFocus` state and
      renders `{touch && amountFocus ? <OperatorBar …/> : <SaveButton/>}`. Touch only — gated on
      `matchMedia('(pointer: coarse)')`, so desktop (which has the keys) always shows Save. Buttons
      map to `+ - * /` and call `insertOp`, which splices at the caret (`selectionStart/End`) and
      restores it via `requestAnimationFrame`; `onPointerDown` preventDefault on the bar keeps the
      field focused so the tap lands (and doesn't dismiss the keyboard / swap the CTA back). Because
      the CTA lives at the bottom of a keyboard-covered sheet, this relies on
      `viewport.interactiveWidget = "resizes-content"` (set in `app/layout.tsx`) to lift the sheet
      above the soft keyboard. The bar is inert mid-calc (`insertOp` no-ops while `calcActive`);
      typed-expression + word-operator paths are unchanged and additive.
  - **Category pills** — the slim glassy chip is the shared **`CatPill`** component (also used by
    EditSheet): 30px tall, 10px radius, dot + label, category-tinted gradient when selected.
- **EditSheet** — tap a Recent-payments row → edit amount, title (description), single `tag`, and
  category → `PUT /api/expenses`. Uses the shared `AmountField` (₹-prefixed) and `CatPill`.
  **Responsive container (mirrors AddSheet)** — a bottom sheet on mobile that becomes a centered
  dialog card on desktop (`useMediaQuery("(min-width: 1024px)")`): full 24px radius, grabber hidden,
  `max-height: calc(100vh - 48px)` with scroll, centered overlay with 24px padding. The
  `tag` is a **chip**: a dashed "+ Add tag" pill when empty; tapping it (or the filled accent chip)
  drops into a compact inline input committed on blur/Enter; the chip's ✕ clears the tag.
- **Transactions** — Recent-payments list: merchant + category pill + date + amount, no minus sign;
  count subtitle + red total pill. Paginated ("load more" via `GET /api/expenses?page=`).
- **useFinance** — optimistic `addExpense` / `editExpense` / `removeExpense` + `reload()`.

## Acceptance criteria
- [ ] POST/PUT persist category + tag; empty tag stores null.
- [ ] No mutation writes any balance row (spend computed on read).
- [ ] Tapping a payment opens EditSheet pre-filled; save updates the row and Spent tile.
- [ ] `total` reflects the whole month, not the current page.
- [ ] user_id scoping on all queries.

## Files to touch
`src/app/api/expenses/route.ts`, `lib/api/schemas.ts`, `lib/api/dashboard.ts`,
`features/dashboard/mobile/{AddSheet,EditSheet,AmountField,CatPill,Transactions,useFinance}.tsx`.

## Out of scope
Budgets, receipts, split transactions, multi-tag. Bills/EMIs live in [bills.md](./bills.md).
