# Design Critique — next-ver dashboard (0.1c)

Code-based (screenshots blocked). Scope: Dashboard, TransactionList, BalancePanel, MonthHeader,
TransactionSection. Forms follow the modal recipe (not re-reviewed). 2026-06-27.

## Overall
Solid structure (skeletons, keyboard a11y, memoization) but **hierarchy is flat** — section titles,
month label, and balance figures all shout at `text-3xl`, so nothing wins. Biggest opportunities:
(1) a real type scale, (2) the screens bypass the design system (raw classes, rings, hand-rolled
input/button), (3) a couple of genuine bugs/risks below.

## 🔴 Real bugs / risks (NOT just polish)
| # | Finding | Where | Fix |
|---|---------|-------|-----|
| B1 | **`text-md` is not a Tailwind class** — silently does nothing; amount text falls back to inherited size | TransactionList.tsx:112 | use `text-base` (or a token) |
| B2 | **One-tap irreversible delete** on a finance app — Trash icon deletes a transaction with no confirm/undo | TransactionList.tsx:123 | add confirm dialog or undo toast |
| B3 | **Delete target ~20px** (bare `w-5 h-5` icon, no padding) below 44px, and absolutely positioned over the clickable row → mis-tap + accidental delete | TransactionList.tsx:123-136 | pad to ≥44px, separate from row hit area |
| B4 | **Closing Balance contrast** — `text-slate-200` on `bg-slate-600` ≈ 2.7:1, fails WCAG AA | BalancePanel.tsx:84-85 | darken card (slate-900) or lighten label |

## Visual hierarchy
- **Everything is `text-3xl`**: section titles (Expenses/Credits/Investments), month label, balance
  numbers. The most important datum (closing balance) reads no louder than a section heading.
  → Establish a scale: balance figures largest, section titles `text-xl/2xl`, labels `text-sm`.
- BalancePanel "Set Starting Balance" heading is `text-lg` while every other heading is `text-3xl`
  → inconsistent heading rank.
- `TransactionSection` `pt-10` (40px) on every section is heavy and competes with `space-y-6` on the
  page → vertical rhythm reads as 16/24/40 px, no consistent step.

## Consistency vs design system
| Element | Issue | Fix |
|---------|-------|-----|
| Radius | Screens all use `rounded-2xl` (undocumented); Modal uses `rounded-3xl` → cards and sheets don't match | pick one surface radius (deferred to redesign per user) |
| Focus rings | `focus:ring-2 focus:ring-slate-900/20·30·40`, `ring-indigo-500/20` everywhere — violates flat-focus (D12) | border-only focus (audit #3) |
| Inputs/buttons | BalancePanel hand-rolls an input + submit button instead of reusing `TextField`/`Button` primitives | reuse primitives |
| Investment rows | Rendered as indigo-bordered cards (`gap-3`, shadow) while expense/credit are flat `divide-y` rows → 3 sections, 2 visual languages | unify list treatment |
| Tokens | Screens still raw `slate-*`/`indigo-*` (1.1 only did primitives) | migrate in 1.2 |
| Arbitrary values | `right-[20px] top-[20px]`, `text-[18px]` off the spacing/type scale | use scale |

## Usability
- **Misleading affordance**: investment rows have hover/`border-indigo-200`/`shadow-md` (look
  clickable) but get no `onSelect` in Dashboard — expense/credit are editable, investments are not.
  Either make them editable or drop the interactive styling.
- Delete overlaps the row's own click/keyboard target → ambiguous tap (see B3).

## What works
- Skeleton states reserve height → no layout shift (matches D9/D10). ✓
- Rows: `role="button"`, `tabIndex`, Enter/Space handling. ✓
- `aria-label` on every icon-only button. ✓
- `TransactionList` memoized + `useMemo`/`useCallback`. ✓

## Priority
1. **B1–B4** — real bugs (invalid class, destructive tap, contrast). Cheap, product-affecting.
2. **Type scale** — biggest visual win; demote section titles, promote balance figures.
3. **Reuse primitives + tokens in screens** (folds into 1.2) — kills rings + hand-rolled controls.
4. **Unify investment vs expense/credit list styling.**
