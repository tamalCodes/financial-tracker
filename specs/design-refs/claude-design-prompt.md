# Claude Design prompt — Kharcha premium revamp

Paste the block below into the design tool.
Everything the tool needs is self-contained (it has no access to our repo).
After it generates, fine-tune, then hand the result back here to implement against.

---

Design a **premium personal-finance dashboard** for a product called **Kharcha**.
The audience is high-net-worth individuals, so the feeling must be *quiet confidence*: calm, precise, restrained, generous whitespace, obsessively consistent. Think private-banking / wealth-app polish and CRED-grade craft — never flashy or cluttered.

## Brand & mood
- Warm, editorial, trustworthy. Restrained luxury. Tactile depth via soft layered shadows and frosted glass — never skeuomorphic, never opaque saturated fills.
- One expressive serif for display headlines; a clean geometric sans for all UI; a mono for tabular numerals.

## Exact color palette (use these, do not invent new hues)
Light theme:
- Background base `#f6f3ea`, page `#efe9db`, card surface `#fbf8f0`.
- Frosted glass surface `rgba(255,253,247,0.6)`. Hairline border `#d6cdb8`.
- Ink (primary text) near-black charcoal `#1e293b`. Muted text warm grey.
- Accent = **gold**: `#9c7b33` (fills/marks), `#8a6d2c` (gold text for contrast). Gold is a *seasoning*, not a paint bucket.

Dark theme:
- Background base `#201b13`, page `#191613`, card surface `#241f17`. Border `#4a4234`.
- Accent gold `#c8a860` / `#d8b36a`. Tactile charcoal surfaces.

Money semantics (both themes): credit/earned = green, spent/expense = red, invested = violet/purple. Keep these three meanings distinct from the gold brand accent.

## Typography
- Display / headlines: **Fraunces** (high-contrast serif).
- Body / all UI / controls / brand wordmark: **Manrope** (geometric sans, controls are never serif).
- Tabular numerals in dense columns: **Overpass Mono**.

## The number system (this is the most important deliverable)
Define ONE consistent grammar for money numbers, in four tiers, and apply it everywhere so no two same-tier numbers ever differ:
- **Hero** — the main balance and the portfolio value. Identical family, size (~34–36px), weight. These must look like siblings.
- **Feature** — card headline amounts (EMI totals, income sum), ~22–24px.
- **Row** — list amounts (payments, holdings, bills), ~14–15px, tabular.
- **Meta** — sub-labels, dates, "4 of 8 paid", ~11–12px, muted.
Use tabular figures wherever numbers align in a column. Keep the `₹` glyph sized consistently relative to digits.

## Screens to design (light AND dark, desktop + a mobile view)
A two-column dashboard:
1. Header: "Overview", greeting, month pill, avatar.
2. **Left in bank** hero card: big balance (Hero tier), month stepper, and three stat tiles — Earned (green), Spent (red), Invested (violet) — as frosted glass tiles.
3. **Monthly trend** chart: earned/spent/invested over 6M/12M. Make it CALM — thin strokes, gentle gradient fills, muted grid, clear axis labels. Lead with one series and mute the others rather than three loud overlapping areas. Design a tooltip that belongs to the same system (same number tiers, same card elevation, soft — no hard rectangular border). No stray focus outline.
4. **Recent payments** list.
5. **Bills** card (list with icons + amounts).
6. **EMIs** card (progress bar, "paid / total", per-EMI rows).
7. **Income** card (salary row, sum pill).
8. **Portfolio value** hero card with Holdings / Active SIPs tabs and a holdings list (Fixed deposits, Mutual funds) with right-aligned mono amounts.

## Card system
Three levels of surface with distinct elevation, radius, and padding: hero cards (balance, portfolio) sit visually above list cards, which sit above stat tiles. Standardize every card header (title + optional sub-label + trailing action) so all top lines share one rhythm. Collapse radii to ~3 values; use one shadow scale.

## Optional brand centerpiece
Explore a physical-feeling "Kharcha card" object (subtle gradient/material, faint sheen, the ₹ mark, a masked balance) as a hero element — inspired by premium credit-card mockups. It must still show real, useful data.

## Deliverables
- A cohesive **design-token sheet**: color, type scale, the 4 number tiers, radius scale, elevation/shadow scale, spacing.
- The full **dashboard** in light and dark.
- A **mobile** version of the key cards.
- Call out hover/press/focus states and any motion (number roll-ups, card enters) — restrained.

Prioritize consistency and legibility over decoration. If a choice is between "interesting" and "calm," choose calm.
