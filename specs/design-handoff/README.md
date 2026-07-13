# Handoff: Finance Dashboard — Mobile (PWA)

> **For the coding agent:** Read this file top to bottom before writing any code. It is self-sufficient — you can implement the whole mobile UI from this document alone. The `.dc.html` files in this folder are **design references**, not production code to copy. Recreate the look and behavior in the target codebase's stack.

---

## 1. Overview

A personal-finance dashboard for an Indian user (₹ / INR, `en-IN` number formatting). The mobile screen is a single scrolling home view inside a phone frame, with a floating action bar and a bottom-sheet for adding entries. It shows: a month balance hero, recent payments, bills & EMIs with pay-offs, and an investments panel (Holdings / Active SIPs tabs).

**Scope of this handoff: the MOBILE UI only.** (The source also contains a desktop layout and a `QuickActions` component — those are *not* part of this handoff and are not included.)

---

## 2. About the design files

The files in this bundle are **design references created in HTML/CSS/JS** — prototypes that show the intended look and behavior. They are authored as "Design Components" (a streaming HTML format); **do not ship them as-is and do not copy their internal structure.**

Your job: **recreate these designs in the target app's existing environment** (React, React Native, SwiftUI, Flutter, Vue, whatever the codebase uses), following its established patterns, component library, and design-token system. If no codebase exists yet, pick the most appropriate framework — given this is described as a "primary PWA," **React + TypeScript (Vite or Next.js) with CSS Modules or Tailwind** is a sound default.

Reference files in this folder:
- `FinanceDashboard.dc.html` — the screen composition + **all state/business logic** (read this for the money model).
- `HeroBalance.dc.html` — month balance hero card.
- `Transactions.dc.html` — recent payments list.
- `BillsEmis.dc.html` — bills & EMIs list with Pay.
- `Investments.dc.html` — portfolio panel with Holdings / Active SIPs tabs.
- `AddSheet.dc.html` — the add-entry bottom sheet (expense / income / investment).
- `support.js` — runtime for the prototype only. **Ignore it; do not port it.**

---

## 3. Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and interactions are final. Recreate pixel-perfectly using the codebase's libraries. Exact values are in §8 (Design Tokens) and per-component in §5.

---

## 4. Frame & global layout

- **Design width:** 412px (phone viewport). Content column max-width 412px, centered.
- **Screen background:** `#f1f5f9` (inside the phone). The surrounding page uses `#e9edf2` with a radial gradient `radial-gradient(1200px 700px at 50% -200px, #eef2f7, #e3e8ef)` — only relevant if you render a device frame; in a real app the screen bg `#f1f5f9` is what matters.
- **Vertical rhythm:** content sections are stacked in a flex column with **16px gap**; outer content padding `4px 16px`, with **104px bottom padding** so the last card clears the floating bar.
- **Status bar** (9:41, signal/wifi/battery) is a prototype affectation — use the OS status bar in a real app.
- Order of sections, top → bottom:
  1. Greeting header (`Good evening` / user name, month pill, avatar)
  2. **HeroBalance** card
  3. **Transactions** card
  4. **BillsEmis** card
  5. **Investments** card
  6. **Floating action bar** (fixed, floats above content)
  7. **AddSheet** bottom sheet (conditionally shown over everything)

### Greeting header
- Left: `Good evening` — `Geist 500 12.5px #94a3b8`; below it the name `Arjun Kapoor` — `Bricolage Grotesque 600 19px, letter-spacing -0.01em, #0f172a`.
- Right: a **month pill** + a **40px circular avatar** (`AK`), gap 10px.
  - Month pill: text `Bricolage 600 12px #4338ca`, bg `linear-gradient(135deg, rgba(99,102,241,0.20), rgba(99,102,241,0.10))`, border `1px solid rgba(99,102,241,0.36)`, radius 999px, padding `6px 11px`.
  - Avatar: 40×40, radius 999px, same gradient/border family at `0.30 / 0.16` and `0.45` border, text `Bricolage 600 14px #4338ca`, centered.

---

## 5. Screens / Components

### 5.1 HeroBalance — "Left in bank" card
**Purpose:** show the money left this month and the earned/spent/invested breakdown; switch months.

- Card: bg `#fff`, border `1px solid #e2e8f0`, radius **26px**, shadow `0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)`, padding `18px`. Flex column, gap 14px.
- **Top row:** label `Left in bank` (`Geist 500 13px #64748b`) on the left; on the right a month stepper — `‹` button, month label, `›` button.
  - Stepper buttons: 30×30, radius 10px, border `1px solid #e2e8f0`, bg `#f8fafc`, chevron icon stroke `#475569` width 2.
  - Month label: `Bricolage 600 13px #334155`, min-width 78px, centered.
- **Balance:** `₹{net}` — `Bricolage 600 36px, line-height 1, letter-spacing -0.03em, #0f172a`, tabular-nums.
- **Three stat tiles** in a `1fr 1fr 1fr` grid, gap 10px, each radius 18px, padding `13px 12px`, flex column gap 8px, with a tinted gradient bg + border + inset highlight `inset 0 1px 0 rgba(255,255,255,0.6)`:
  - **Earned** (green): bg `linear-gradient(135deg, rgba(16,185,129,0.30), rgba(16,185,129,0.15))`, border `rgba(16,185,129,0.45)`. Label row: up-arrow icon + `Earned` in `Bricolage 600 11.5px #047857`. Value `₹{earned}` `Bricolage 600 16.5px #065f46`.
  - **Spent** (red): gradient `rgba(239,68,68,0.26 → 0.13)`, border `rgba(239,68,68,0.42)`. Down-arrow + `Spent` `#b91c1c`. Value `₹{spent}` `#991b1b`.
  - **Invested** (purple): gradient `rgba(139,92,246,0.26 → 0.13)`, border `rgba(139,92,246,0.42)`. Trend-up icon + `Invested` `#6d28d9`. Value `₹{invested}` `#5b21b6`.

### 5.2 Transactions — "Recent payments" card
**Purpose:** list this month's payments (debits).

- Card: same `#fff` / `#e2e8f0` / radius **28px** / same shadow, padding `22px 22px 10px`, flex column.
- **Header row:** title `Recent payments` (`Bricolage 600 16px #0f172a`) with subtitle `{count} this month · newest first` (`Geist 500 12px #94a3b8`). Right side: a **total pill** `₹{logged}` — `Bricolage 600 11.5px #b91c1c`, bg `linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.09))`, border `rgba(239,68,68,0.34)`, radius 999px, padding `5px 10px`, tabular-nums. **Note: no minus sign** — these are understood to be debits.
- **Each row** (separated by top border `1px solid #f1f5f9`, padding `11px 1px`):
  - Left: a **column** — merchant name (`Geist 600 14px #0f172a`, truncates with ellipsis) above a row containing a **category pill** + date.
    - Category pill: `Bricolage 600 10.5px`, text color = category text color, bg `rgba(<cat-rgb>, 0.13)`, border `rgba(<cat-rgb>, 0.28)`, radius 999px, padding `2px 8px`.
    - Date: `Geist 500 11.5px #94a3b8`.
  - Right: amount `₹{amount}` — `Bricolage 600 14px #b91c1c`, tabular-nums. **No minus sign.**
- Category colors: see §8.

### 5.3 BillsEmis — "Bills & EMIs" card
**Purpose:** show upcoming bills/EMIs and let the user mark them paid.

- Card: `#fff` / `#e2e8f0` / radius **28px** / same shadow, padding `22px 22px 12px`.
- **Header:** title `Bills & EMIs` (`Bricolage 600 16px #0f172a`) on the left (no subtitle). Right, right-aligned column: label `Paid this month` (`Geist 500 11px #64748b`) above value `₹{paidTotal}` (`Bricolage 600 18px #047857`, green, tabular-nums). This total **recomputes** as bills are paid.
- **Two row states** (each row has top border `1px solid #f1f5f9`):
  - **Unpaid** (padding `13px 1px`): left = a **plain line icon** (20px, stroke `#94a3b8`, width 1.6 — **no boxed background**) next to a column of name (`Geist 600 14px #0f172a`) + `Due {date}` (`Geist 500 11.5px #94a3b8`). Right = amount `₹{amount}` (`Bricolage 600 14px #0f172a`) + a **Pay pill** button.
    - Pay pill: `Bricolage 600 13px #4338ca`, bg `#eef2ff`, no border, radius 999px, padding `0 18px`, height 36px.
  - **Paid** (same layout, `opacity: 0.62`): icon is a green check (stroke `#047857`, width 2.2, no box); name has `line-through` (`#475569`, strike color `#cbd5e1`); subtitle is just the date; amount is muted `#94a3b8`; instead of a button, a static `Paid` label (`Bricolage 600 12px #047857`).
- **There is NO overdue state.** (Earlier versions had one; it was removed — do not add overdue styling or logic.)
- **No issuer/description line** — only title + date.

### 5.4 Investments — portfolio panel
**Purpose:** show portfolio value and holdings, with a tab for active SIPs.

- Card: `#fff` / `#e2e8f0` / radius **28px** / same shadow, padding `24px`, flex column gap 18px.
- **Top:** label `Portfolio value` (`Geist 500 12.5px #64748b`) above `₹{portfolioTotal}` (`Bricolage 600 30px, letter-spacing -0.025em, #0f172a`, tabular-nums). **No gain/percentage pill.**
- **Segmented tab control:** a flex row in a `#f1f5f9` track, radius 13px, padding 4px, gap 4px. Two equal buttons (`Bricolage 600 12.5px`, radius 9px, padding `9px 0`):
  - Active tab: bg `#fff`, text `#0f172a`, shadow `0 1px 2px rgba(15,23,42,0.12)`.
  - Idle tab: transparent bg, text `#64748b`.
  - Tabs: **Holdings** (default) and **Active SIPs**.
- **Holdings tab** — two sub-sections, each with an uppercase section label (`Bricolage 600 11px, letter-spacing 0.06em, uppercase, #94a3b8`):
  - **Fixed Deposits:** plain rows (padding `12px 2px`, bottom border `1px solid #f1f5f9`) — left column name (`Geist 600 13.5px #0f172a`) + sub (`Geist 500 11px #94a3b8`, e.g. `7.10% p.a. · matures 14 Mar 2027`); right amount `₹{amount}` (`Bricolage 600 14px #0f172a`). **No icon, no colored card, no percentages.**
  - **Mutual Funds:** plain rows — name on the left (truncates), current value `₹{current}` on the right. **No percentages.**
- **Active SIPs tab** — section label `Active SIPs`, then a row per SIP (padding `12px 2px`, bottom border): left column = name (`Geist 600 13.5px`) + `Due {date}` (`Geist 500 11px #94a3b8`); right column (right-aligned) = `₹{monthly}/mo` (`Bricolage 600 14px #0f172a`) + `Paid ₹{paid}` (`Geist 500 11px #94a3b8`).
- Tab selection is **local UI state** in this component.

### 5.5 Floating action bar
**Purpose:** quick entry points for Expense / Income / Invest. Floats at the bottom, **inside** the screen (like Instagram/WhatsApp bottom bars), not edge-to-edge.

- A centered pill, absolutely positioned near the bottom of the screen (in the prototype: `bottom: 34px`, centered). It should float above content and stay put while content scrolls under it (use a fixed/sticky bottom-centered element in a real app, respecting safe-area insets).
- Pill container: flex row, **gap 12px**, padding 9px, radius **999px**, bg `rgba(255,255,255,0.82)` with `backdrop-filter: blur(18px) saturate(1.8)`, border `1px solid rgba(226,232,240,0.95)`, shadow `0 22px 48px -14px rgba(15,23,42,0.45), 0 2px 8px rgba(15,23,42,0.06)`.
- **Three circular icon buttons** (50×50, radius 999px), **icon-only — no text labels**:
  - **Expense** (red): bg `linear-gradient(135deg, rgba(239,68,68,0.26), rgba(239,68,68,0.13))`, border `rgba(239,68,68,0.42)`, down-arrow icon stroke `#b91c1c`.
  - **Income** (green): gradient `rgba(16,185,129,0.28 → 0.14)`, border `rgba(16,185,129,0.45)`, up-arrow stroke `#047857`.
  - **Invest** (purple): gradient `rgba(139,92,246,0.26 → 0.13)`, border `rgba(139,92,246,0.42)`, trend-up stroke `#6d28d9`.
- Each button opens the **AddSheet** in the matching mode.

### 5.6 AddSheet — add-entry bottom sheet
**Purpose:** add an expense, income, or investment. One sheet, three modes.

- **Presentation:** a bottom sheet that slides up. Backdrop `rgba(15,23,42,0.40)` with `backdrop-filter: blur(3px)`; tapping the backdrop closes; tapping the sheet does not (stop propagation). Sheet: bg `#fff`, radius `30px 30px 0 0`, shadow `0 -18px 60px -18px rgba(15,23,42,0.45)`, max-width 460px, anchored to the bottom. Respect `env(safe-area-inset-bottom)`.
- **Grabber:** a 42×5 `#e2e8f0` pill, centered at top.
- **Header:** title `{title}` (`Bricolage 600 21px #0f172a`) + a 36×36 close button (`✕`, radius 12px, border `#e2e8f0`, bg `#f8fafc`, color `#64748b`).
- **Amount field:** label `Amount` (`Geist 500 13px #475569`); input box height 62px, radius 16px, border `#e2e8f0`, bg `#f8fafc`, padding `0 16px`, with a leading `₹` (`Bricolage 600 26px #94a3b8`) and a numeric input (`Bricolage 600 28px #0f172a`, tabular-nums, `inputmode="numeric"`, placeholder `0`). **Strip all non-digits on input.**
- **Category picker** — **expense mode only.** Label `Category`; a wrapping flex row (gap 8px) of pill toggles (height 40px, radius 999px, padding `0 15px`, `Bricolage 600 13px`, with an 8px dot):
  - Selected: text = category text color, bg `linear-gradient(135deg, rgba(<rgb>,0.30), rgba(<rgb>,0.15))`, border `rgba(<rgb>,0.50)`, dot = category text color.
  - Idle: text `#64748b`, bg `#fff`, border `#e2e8f0`, dot `#cbd5e1`.
  - Categories: Food, Shopping, Transport, Health, Groceries, Other (see §8 for colors). Default selected: **Food**.
- **Note/Source/Fund field:** label is mode-dependent (`Note` / `Source` / `Fund`); single-line input, height 50px, radius 14px, border `#e2e8f0`, bg `#f8fafc`, `Geist 16px`, focus border `#818cf8`. Placeholder is mode-dependent (see §6).
- **Submit button:** full-width, height 54px, radius 16px, bg `#4f46e5`, text `#fff` (`Bricolage 600 15.5px`), shadow `0 8px 20px -8px rgba(79,70,229,0.55)`. Label is mode-dependent.

---

## 6. Mode matrix (AddSheet)

| Mode | Title | Submit label | 2nd field label | Placeholder | Category picker? | On save |
|---|---|---|---|---|---|---|
| `expense` | Add expense | Add expense | Note | e.g. Swiggy dinner | **Yes** | Prepend a new transaction (merchant = note or category label, dated "Today") |
| `income` | Add income | Add income | Source | e.g. June salary | No | Add amount to `extraIncome` |
| `investment` | Add investment | Add investment | Fund | e.g. UTI Nifty 50 SIP | No | Add amount to `extraInvest` |

After a successful save the sheet closes and the form resets (amount + note cleared). Save is a no-op if amount parses to 0/empty.

---

## 7. Interactions, state & the money model

All numbers are formatted with `Intl.NumberFormat('en-IN')` and clamped to `>= 0`, rounded.

### State variables
- `monthIdx` (int, default **3**) → indexes `['March 2026','April 2026','May 2026','June 2026','July 2026']`. Prev/next clamp to `[0,4]`. (This is display-only in the prototype — the figures don't change per month; in production you'd fetch per-month data.)
- `txs` — array of transactions `{ merchant, cat, amount, date }`. Seed list (newest first):
  - Swiggy Instamart · food · 642 · Today
  - Myntra · shopping · 3499 · 25 Jun
  - Uber · transport · 318 · 25 Jun
  - Apollo Pharmacy · health · 1240 · 24 Jun
  - Zomato · food · 880 · 22 Jun
  - Reliance Trends · shopping · 4200 · 21 Jun
- `paid` — map of `billId → true` for bills marked paid. Seed: `gas` (Piped Gas) starts paid.
- `extraIncome` (default 0), `extraInvest` (default 0) — accumulate from the AddSheet.
- `sheet` — `null | 'expense' | 'income' | 'investment'` (which AddSheet mode is open).
- Form: `formAmount` (digits string), `formNote` (string), `formCat` (category key, default `food`).
- Investments tab is **local** to that component: `tab ∈ { 'holdings', 'sips' }`, default `holdings`.

### Derived money model (recompute on every change)
```
salary      = 184500           // configurable
autoInvest  = 30000            // configurable
SPENT_BASE  = 86461            // base spend before logged txns
loggedSum   = sum(txs.amount)
earned      = salary + extraIncome
invested    = autoInvest + extraInvest
spent       = SPENT_BASE + loggedSum
net         = earned - spent - invested      // "Left in bank"
```
- Transactions header: `count = txs.length`, `logged = loggedSum`.
- Bills `paidTotal` = sum of paid bills' amounts; `dueTotal` (if you show it) = sum of unpaid.

### Bills data (seed)
`{ id, name, amount, due, icon }` — issuer is intentionally not displayed:
- `cc`   · HDFC Credit Card · 14200 · 25 Jun
- `elec` · Electricity · 2340 · 28 Jun
- `home` · Home Loan EMI · 28450 · 05 Jul
- `car`  · Car Loan EMI · 11800 · 07 Jul
- `net`  · Broadband · 1199 · 02 Jul
- `gas`  · Piped Gas · 620 · 18 Jun · **paid by default**

Paying a bill sets `paid[id] = true` (optimistic, immediate); the row flips to the paid state and `Paid this month` increases.

### Investments data (seed)
- **Fixed Deposits:** SBI Fixed Deposit · `7.10% p.a. · matures 14 Mar 2027` · ₹2,00,000. (Only one FD currently; design supports a list.)
- **Holdings (Mutual Funds):** UTI Nifty 50 Index Fund ₹1,38,400 · Parag Parikh Flexi Cap ₹84,200 · Quant Small Cap ₹78,900.
- **Active SIPs:** UTI Nifty 50 Index Fund — ₹10,000/mo · Due 05 Jul · Paid ₹1,20,000; Parag Parikh Flexi Cap — ₹7,500/mo · Due 10 Jul · Paid ₹90,000; Quant Small Cap — ₹5,000/mo · Due 15 Jul · Paid ₹60,000.
- `portfolioTotal` = ₹6,51,500.

### Behavior notes
- Tapping a floating-bar button opens AddSheet in that mode and resets the form.
- Month chevrons step `monthIdx`; clamp at ends.
- Inputs: amount strips non-digits; saving with empty/0 amount is ignored.
- No real network/persistence in the prototype — wire these to your API/store. Optimistic UI on Pay and on add is expected.

---

## 8. Design tokens

### Typography
- **Display / numerals / labels:** `Bricolage Grotesque` (weights 400–700). Used for headings, balances, button labels, pills.
- **Body / secondary text:** `Geist` (weights 400–600).
- Tabular figures everywhere money appears: `font-variant-numeric: tabular-nums`.
- Tight tracking on big numbers: balance `-0.03em`, portfolio `-0.025em`, stat values `-0.02em`.
- Swap to the codebase's nearest equivalents if these aren't available, but keep the "geometric grotesque display + clean sans body" pairing.

### Color — neutrals
| Token | Hex |
|---|---|
| Screen bg | `#f1f5f9` |
| Card bg | `#ffffff` |
| Card border | `#e2e8f0` |
| Divider | `#f1f5f9` |
| Input bg | `#f8fafc` |
| Text primary | `#0f172a` |
| Text secondary | `#475569` / `#64748b` |
| Text muted | `#94a3b8` |
| Phone frame (if used) | `#0f172a` |

### Color — brand / accents
| Token | Value |
|---|---|
| Indigo primary (buttons) | `#4f46e5` |
| Indigo text/accent | `#4338ca` |
| Indigo tint bg | `#eef2ff` |
| Indigo focus ring | `#818cf8` |
| Green base (rgb) | `16,185,129` · text `#047857` / deep `#065f46` |
| Red base (rgb) | `239,68,68` · text `#b91c1c` / deep `#991b1b` |
| Purple base (rgb) | `139,92,246` · text `#6d28d9` / deep `#5b21b6` |

Accent tiles/pills are built as `linear-gradient(135deg, rgba(<base>, A), rgba(<base>, B))` with a matching `rgba(<base>, C)` border — see each component for the exact alphas.

### Category colors (transactions + expense picker)
| Category | rgb (for tints) | text |
|---|---|---|
| Food | `245,158,11` | `#b45309` |
| Shopping | `139,92,246` | `#6d28d9` |
| Transport | `14,165,233` | `#0369a1` |
| Health | `16,185,129` | `#047857` |
| Groceries | `20,184,166` | `#0f766e` |
| Other | `100,116,139` | `#475569` |

### Radii
- Stat tiles / list pills containers: 18px
- Cards: 26px (hero) / 28px (transactions, bills, investments)
- Bottom sheet: 30px (top corners only)
- Pills / chips / circular buttons / tab track: 999px / 13px track
- Small buttons (steppers, close): 10–12px

### Shadows
- Card: `0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -22px rgba(15,23,42,0.30)`
- Floating bar: `0 22px 48px -14px rgba(15,23,42,0.45), 0 2px 8px rgba(15,23,42,0.06)`
- Bottom sheet: `0 -18px 60px -18px rgba(15,23,42,0.45)`
- Submit button: `0 8px 20px -8px rgba(79,70,229,0.55)`
- Active tab: `0 1px 2px rgba(15,23,42,0.12)`
- Tile inset highlight: `inset 0 1px 0 rgba(255,255,255,0.6)`

### Spacing
Section gap 16px; card inner gaps 14–18px; list row padding ~12–13px vertical; tile grid gap 10px. The frosted surfaces use `backdrop-filter: blur(14–18px) saturate(1.7–1.8)`.

---

## 8b. Screenshots (visual reference)

Rendered PNGs of the mobile UI are in `screenshots/`:
- `01-home-balance.png` — greeting header + HeroBalance card (top of screen).
- `02-recent-payments.png` — Transactions card with category pills.
- `03-bills-emis.png` — Bills & EMIs with unpaid (Pay pill) and paid (struck-through) rows.
- `04-investments-holdings.png` — Investments / **Holdings** tab (Fixed Deposits + Mutual Funds).
- `05-investments-sips.png` — Investments / **Active SIPs** tab.
- `06-add-expense-sheet.png` — AddSheet bottom sheet in **expense** mode (with category picker).

These show final styling; treat the per-component specs in §5 and tokens in §8 as the exact source of truth for measurements.

---

## 9. Icons & assets

All icons are inline **stroke SVGs** (Lucide/Feather style, stroke-width ~1.6–2.2, rounded caps/joins). No raster image assets. Map each to your icon set:
- Hero stats: arrow-up (earned), arrow-down (spent), trending-up (invested).
- Floating bar: arrow-down (expense), arrow-up (income), trending-up (invest).
- Month stepper: chevron-left / chevron-right.
- Bills: credit-card, bolt/zap, home, car, wifi, flame; paid = check.
- No logos or brand imagery are required.

Fonts are loaded from Google Fonts (`Bricolage Grotesque`, `Geist`) — install equivalents or self-host in production.

---

## 10. Suggested implementation plan

1. **Set up tokens** (§8) as theme variables / Tailwind config / design-token file in the target codebase.
2. **Build leaf components** in this order, each from §5: `HeroBalance`, `TransactionRow`/`Transactions`, `BillRow`/`BillsEmis`, `Investments` (with the tab control), `AddSheet`.
3. **Build the home screen** that composes them in the order in §4, plus the greeting header and floating action bar.
4. **Wire the state/money model** from §7 into your state container (hooks/store) — derive `earned/spent/invested/net`, transactions list, paid bills, and the add-entry mutations.
5. **Wire the AddSheet** with the mode matrix (§6); open from the floating bar; optimistic add/pay.
6. **Replace mock data** with real API/store; keep the optimistic UI.
7. QA against the per-component specs and the reference HTML rendered in a browser.

---

*Generated as a developer handoff. The `.dc.html` references are the source of truth for visual detail; this README is the source of truth for behavior and tokens.*
