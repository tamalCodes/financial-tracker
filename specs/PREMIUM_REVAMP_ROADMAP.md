# Premium Revamp Roadmap — Kharcha → HNI-grade

Status: planning (not "as-built").
Owner: design + frontend.
Goal: take Kharcha from "good" to a product a high-net-worth individual trusts with their money.

This document is a roadmap and checklist, not an implementation.
We do the foundation work first, then apply it surface by surface.
Nothing here should ship as a big-bang rewrite — each phase is independently shippable and reversible.

---

## 0. What "premium" means here (the north star)

Premium finance UI is not flashy.
For HNI trust the feeling we want is *quiet confidence*: calm, precise, restrained, generous with space, obsessively consistent.
The opposite — and what hurts us today — is ad-hoc: numbers in different fonts, cards with drifting radii, a chart that competes with itself.

Design principles for this revamp:

1. **Consistency beats novelty.** One number system, one radius scale, one shadow scale. A single visible inconsistency reads as "not serious about money."
2. **Numbers are the product.** Money numerals get a deliberate, tiered system — this is the single highest-impact fix.
3. **Restraint.** The gold accent is a seasoning, not a paint bucket. Charts are calm, not maximal.
4. **Tactile depth, not decoration.** Soft layered shadows and glass to imply hierarchy — never skeuomorphic clutter.
5. **Legibility first.** A wealthy user scanning balances at a glance must never squint or second-guess.

---

## 1. Diagnosis — what breaks the premium feel today (grounded in current screens)

These are observed in the shipped desktop + mobile dashboard, with file references.

### 1.1 There is no number system (highest priority)
- Left-in-bank `₹1,37,182` renders **Fraunces serif, 36px** — `HeroBalance.tsx:171`.
- Portfolio value `₹2,79,996` renders **Manrope sans, 30px** — `Investments.tsx:118-120`.
- Two hero-level numbers, different family *and* size — this is the "looks like something else" the user flagged.
- Elsewhere numbers are 14 / 16 / 16.5 / 18 / 19px at assorted weights, all declared inline per component.
- Result: no visual grammar for money. The eye can't tell what's a hero, a feature, a row, or a footnote.

### 1.2 The serif/sans split is applied per-component, not by rule
- The hero number is serif; the chart tooltip numbers are sans (`TrendChart.tsx:176`).
- Same "amount" concept, two typefaces → the user perceives "completely different fonts."

### 1.3 The chart is visually noisy and has a stray focus box
- Three stacked translucent areas + three curves overlap into a busy blob ("all over the place").
- Clicking the chart shows a hard rectangular outline — that is the browser focus ring on the chart container/SVG, not an intentional border. It reads as a bug.
- The tooltip is a glass card whose type/spacing doesn't echo the rest of the app, so it feels foreign.
- Axis labels are tiny (11px) and low-contrast.

### 1.4 Cards are uniform and flat
- Every surface is a similar rounded rectangle with a similar border/shadow.
- Radii drift: 26 / 28 / 9 / 10 / 12 / 14px across components.
- Shadows are re-declared per component (`CARD_SHADOW` copies) rather than a scale.
- There is no hierarchy of "hero object" vs "list card" vs "stat tile" — so nothing feels marquee.

### 1.5 The accent and materials are underused for premium cues
- Gold accent mostly appears in small controls; the marquee surfaces don't use warmth/metal to signal value.
- Stat tiles are flat pastel fills; they could carry the glass treatment the design system already defines.

---

## 2. Reference strategy — how we capture "the look"

**Constraint to know:** I cannot open Figma share links directly (they render behind login + JS; a URL fetch returns nothing).
Two workable ways to feed me references:

1. **Screenshots / PNG exports (fastest).** Screenshot the frames you like and paste them in chat, or drop exports into `specs/design-refs/` in the repo. This already works well — the app screenshots you shared drove this whole diagnosis.
2. **Figma Dev Mode MCP connector.** If you enable the Figma connector via `/mcp` in an interactive Claude Code session, I can read frames, tokens, and components natively. It is available but not authorized in the current session.

**Reference archetypes we are targeting** (so we're aligned even before files arrive):
- **CRED / NeoPOP** — serif display headline, calm tactile cards, mono numerals, disciplined spacing, dark tactile surfaces.
- **Premium banking dashboards** (private-banking / wealth apps) — one dominant hero metric per card, huge whitespace, muted single-emphasis charts, understated color.
- **Card mockup / stacked-card kits** (the Figma file you linked) — layered physical cards with depth and material, used as a brand centerpiece object.

When references arrive, we map each to a concrete token or component decision below rather than copying pixel-for-pixel.

---

## 3. Phase plan (sequenced, each independently shippable)

| Phase | Theme | Why this order | Felt impact |
|---|---|---|---|
| 0 | **Foundations / tokens** | Everything downstream depends on it; no visual regression on its own | Invisible but enabling |
| 1 | **Number system** | The #1 thing the user feels is wrong | Very high |
| 2 | **Chart revamp** | Second most-cited pain; self-contained | High |
| 3 | **Card system & depth** | Needs tokens from Phase 0; broad surface | High |
| 4 | **Hero card / brand object** | The "CRED-like card" centerpiece | High (brand) |
| 5 | **Dark mode + motion polish** | Layered on a stable system | Medium |
| 6 | **QA / a11y / spec sync** | Lock it in | Trust |

---

## 4. Phase 0 — Foundations (design tokens)

The backbone. No screen should change look in this phase; we only introduce tokens and swap raw values for them.

- [ ] **Numeric type scale** — define money-number tiers with exact family + size + weight + tracking + numeric features. Draft below in §5.
- [ ] **Text type scale** — display / title / body / caption, each a named token.
- [ ] **Radius scale** — collapse the 9/10/12/14/26/28 drift into ~3 tokens (e.g. `--r-card`, `--r-control`, `--r-pill`). Reuse the existing `--radius-*` where possible.
- [ ] **Elevation scale** — one shadow set (`--e1`/`--e2`/`--e3`), replace per-component `CARD_SHADOW` copies.
- [ ] **Spacing / card-padding standard** — one padding rhythm for cards, one for tiles.
- [ ] **Accent-usage rules** — where gold is allowed, and where it is forbidden (keeps CTA charcoal per existing D-rule).
- [ ] **Motion tokens** — durations + easings, plus reduced-motion behavior.
- [ ] Update `specs/DESIGN_SYSTEM.md` to make these the single source of truth.

Exit criteria: tokens exist and are referenced by at least one component; visual diff on existing screens is ~zero.

---

## 5. Phase 1 — The Number System (highest felt impact)

This is the fix the user will feel immediately.
We define one grammar for money numerals and apply it everywhere.

### Proposed tiers (draft — needs sign-off in §10)
| Tier | Use | Family | Size (desktop) | Weight | Notes |
|---|---|---|---|---|---|
| **Hero** | Left-in-bank, Portfolio value | one family, one size | 34–36 | 600 | Must be identical across all hero numbers |
| **Feature** | Card headline amounts (EMI totals, Income sum) | same family as Hero | 22–24 | 600 | |
| **Row** | List amounts (payments, holdings, bills) | Manrope | 14–15 | 600 | `tabular-nums` |
| **Meta** | Sub-labels, "4 of 8 paid", dates | Manrope | 11–12 | 500 | muted color |

- [ ] **Decide the hero/feature family** (see §10 — my recommendation is one consistent choice, not serif-here-sans-there).
- [ ] Make **Left-in-bank and Portfolio value pixel-identical** in family, size, weight, tracking.
- [ ] Route every money number through the tier tokens/constants (kill inline `fontSize: 30/36/…`).
- [ ] Apply **`tabular-nums`** everywhere numbers align in columns.
- [ ] Consider **Overpass Mono** for dense tabular columns (Holdings list) to add fintech texture — optional, only where numbers stack in a column.
- [ ] Currency glyph treatment consistent (`₹` size/weight relative to digits).

Exit criteria: no two same-tier numbers differ in family/size/weight anywhere in the app.

---

## 6. Phase 2 — Chart revamp

- [ ] **Remove the focus box** — clicking the chart must not show a hard outline; handle container/SVG focus with `outline: none` + a proper `:focus-visible` treatment.
- [ ] **Tooltip belongs to the system** — its numbers use the Row tier, its elevation uses `--e2`, spacing echoes the cards; it should feel native, not foreign.
- [ ] **Calm the plot** — thinner strokes, gentler gradient fills, muted grid, larger/clearer axis labels; consider de-emphasizing two series and letting one lead, or a toggle for which metric is primary.
- [ ] **Empty/locked state** keeps its tasteful blur teaser but adopts the new tokens.
- [ ] Verify recharts theming reads CSS variables in both light and dark.

Exit criteria: chart reads calm at a glance; clicking never produces a stray box; tooltip is indistinguishable in "voice" from the cards.

---

## 7. Phase 3 — Card system & depth

- [ ] Define a **card hierarchy**: hero card (balance, portfolio), list card (bills, payments, holdings), stat tile (Earned/Spent/Invested).
- [ ] Give each level a distinct **elevation + radius + padding** from the scale — hero cards sit visually "above" list cards.
- [ ] Apply the existing **glass treatment** to hero surfaces and stat tiles per `DESIGN_SYSTEM.md` (never opaque saturated fills).
- [ ] Standardize card headers (title tier, optional sub-label, trailing action) so every card's top line is rhythmically identical.
- [ ] Normalize the `+` / action affordances across cards.

Exit criteria: a user can tell the importance of a surface from its depth/size alone.

---

## 8. Phase 4 — Hero card / brand object (the "CRED-like card")

This is where the card-mockup references come in.

- [ ] Design a **Kharcha "card" object** — a physical-feeling account/portfolio card as a brand centerpiece (gradient/material, subtle sheen, the ₹ mark, masked balance).
- [ ] Decide placement: top of dashboard, or a dedicated hero band.
- [ ] Optional **stacked-cards** interaction (peek/expand) inspired by the linked kit, if it earns its complexity.
- [ ] Keep it honest — a decorative card must still show real, useful data.

Exit criteria: there is one unmistakable "hero object" that makes the app feel like a product, not a spreadsheet.

Blocked on: your card references (screenshots/exports per §2).

---

## 9. Phase 5 — Dark mode + motion polish

- [ ] Full **HNI dark theme** pass — tactile charcoal surfaces, verify every new token flips correctly.
- [ ] Restrained **motion**: number roll-ups on load, card enter transitions, chart draw-in — all behind the motion tokens and reduced-motion guard.
- [ ] Hover/press states on every interactive surface.

---

## 10. Open decisions (need your call — with my recommendations)

1. **Hero-number family.** Serif everywhere for hero+feature numbers (elegant, editorial) *or* sans display + mono for tabular columns (the literal CRED texture)?
   - *Recommendation:* pick **one family for all hero+feature numbers** (I lean Fraunces serif at a single size for both balance and portfolio), Manrope for rows, and Overpass Mono only for the Holdings column. Consistency is the whole point.
2. **Chart emphasis.** Keep all three series equal, or lead with one (e.g. net/spent) and mute the rest?
   - *Recommendation:* lead with one, mute the others — far calmer.
3. **Hero card object.** Do we want the physical-card centerpiece now (Phase 4) or defer until the number/chart/card work lands?
   - *Recommendation:* defer to Phase 4 as planned; it shines only once the system underneath is clean.
4. **Light vs dark as the "premium" flagship.** Which do we polish first?
   - *Recommendation:* light first (it's what you use), dark in Phase 5.

---

## 11. How we work this roadmap

- One phase at a time; I show the change, you react, we refine — no big-bang.
- Every phase updates the relevant `specs/` docs in the same batch (per repo rules).
- References: drop screenshots/exports any time; each one gets mapped to a concrete token/component decision here.
- This file is the living plan — checkboxes get ticked as phases land.
