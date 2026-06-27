# Design System Migration — Working Log

> Resumable plan + progress for codifying the design system and hardening mobile/UI.
> Source of truth for *design rules* stays [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); this file
> tracks the *migration work*. Update the "Status" + "Log" sections each session.

**Scope:** `next-ver/` only (Next 16, React 19, Tailwind v4 CSS-first). Root Vite app = legacy, ignore.
**Started:** 2026-06-27

## Locked decisions
- **shadcn = reference only.** Keep custom glass/indigo primitives. Use `vercel:shadcn` skill for
  accessible patterns / new component ideas, ported to house style. No Radix dep.
- **Token codification = semantic layer.** Named tokens (`text-primary`, `accent`, `surface`,
  semantic transaction colors) mapping to slate/indigo/etc. Components reference meaning, not raw color.
- **Order:** Phase 0 audit → 0.2 tokens → 0.3 mobile spec → Phase 1 implement.
- **Semantic transaction palette (user-confirmed):** credit=green, expense=red, investment=purple,
  indigo=brand accent. NOT drift. Add as tokens; never glass-ify or collapse to indigo.

## Status
- [x] 0.1a — design-system code audit (done 2026-06-27, findings below)
- [ ] 0.1b — accessibility-review (mobile touch targets 44px, glass contrast, focus visibility) — NOT STARTED
- [x] 0.1c — design-critique — DONE 2026-06-27 → specs/DESIGN_CRITIQUE.md. Found 4 real bugs (B1
      text-md invalid class, B2 one-tap irreversible delete, B3 <44px delete target, B4 closing-balance
      contrast fail) + flat type hierarchy + screens bypass design system.
- [PARKED] 1.2 screen drift, a11y nits, doc-gap, 0.1b accessibility, 1.3 screenshots — user 2026-06-27:
      "merely enhancements, won't directly affect product." Revisit at full redesign.
- [x] 0.2 — codify `@theme` semantic tokens in globals.css — DONE 2026-06-27 (build verified green)
- [x] 0.3 — mobile-standards section in DESIGN_SYSTEM.md §6 — DONE 2026-06-27. Also fixed real bug:
      added `viewport` export with `viewportFit:"cover"` in layout.tsx (env safe-area-inset was dead → 0).
- [x] 1.1 — migrate primitives to tokens (pure refactor) — DONE 2026-06-27 (build green, zero visual change)
- [ ] 1.2 — fix audit findings (touch targets, contrast, rings) — NOT STARTED
- [~] 1.3 — verify — PARTIAL 2026-06-27. DONE: react-best-practices review (migration clean; 2
      pre-existing a11y nits — Modal missing aria-labelledby, close btn <44px), build green.
      BLOCKED: mobile screenshots — no Claude Chrome extension installed + can't auth myself (password
      rule). Resume when extension installed: user logs into localhost:3000, then screenshot dashboard
      + modals at mobile width. preview-tool fallback can only do public pages (login/signup).
- [ ] 1.4 — `graphify update .` — NOT STARTED

## 0.1a Audit findings (design-system, code-based)
Score 38/100. `globals.css` has **no `@theme` block** — 0 defined tokens. All raw utilities.

Hardcoded counts (next-ver/src, *.tsx): ~120 raw `slate-*`, ~15 `indigo-*`, 19 `red-*`,
62 radius utils (6 distinct), 10 arbitrary sizes.

Drift vs spec:
1. ~~`rounded-2xl` undocumented~~ → DEFERRED by user: leave as-is, revisit during full app redesign.
2. **`text-slate-400` overused (10×)** > slate-500 (9×). Spec: muted=`slate-500`, explicitly NOT
   slate-400 (contrast). Likely contrast violations — verify in 0.1b.
3. **Rings present** `ring-slate-900`×6, `ring-indigo-500`×1 — violates D12 flat-focus "no ring".
   Migrate `ring-*` → `border-*`.
4. ~~Second hue emerald~~ → RESOLVED: legit credit-green semantic. Tokenize, document in spec.
5. **Indigo border drift** `indigo-100/200/300` (4 off-spec shades). Focus should be `indigo-400` only.
6. **Arbitrary sizes** `[20px][18px][6rem][500px]` bypass a (nonexistent) spacing scale.

Open items:
- ~~No purple in next-ver~~ → RESOLVED: investment = `text-indigo-600` in `TransactionList.getAmountTone()`,
  aliases the brand accent (reads purple, isn't a separate token). User OK with look. Tokenize
  `--color-investment` → indigo-600 now; option B = split to violet-600 later. See memory transaction-color-semantics.
- AmountInput uses inline `style={{}}` (the only inline-style file) — review during 1.1.
- **Color collision to flag in spec:** investment tone == brand accent (both indigo-600). `text-indigo-600`
  also used for AmountInput status text + Dashboard investment icon + ToggleCard active. When tokenizing,
  separate `--color-accent` from `--color-investment` even if both map to indigo, so they can diverge.

## Token set (SHIPPED 0.2 — in globals.css @theme)
Utilities now available (additive; raw palette utils still work):
- Text: `text-ink` (900), `text-body` (700), `text-muted` (500), `text-faint` (400/placeholder)
- Surface: `bg-surface` (white), `bg-field` (slate-50), `border-line` (slate-200)
- Accent: `text/bg-accent` (indigo-500), `-accent-strong` (indigo-600), `border-focus` (indigo-400)
- Txn: `text-credit` (emerald-600), `text-expense` (red-600), `text-investment` (indigo-600)
- Error: `text-danger` / `bg-danger-surface`
- Radius: `rounded-control` (xl), `rounded-surface` (3xl), `rounded-pill`
- Spacing: `field` (20px), `section` (24px) → `gap-field`, `px-section`

## Log
- 2026-06-27 — Phase 0.1a done. Memory saved: transaction-color-semantics. shadcn=reference,
  tokens=semantic, audit-first decisions locked. Next: run 0.1b accessibility-review when resumed.
- 2026-06-27 — Verified investment color = indigo-600 (aliases brand accent) per user screenshot.
  rounded-2xl deferred to redesign. Resolved both open items.
- 2026-06-27 — 0.1b accessibility + 0.1c critique DEFERRED by user. Did 0.2: shipped @theme semantic
  tokens in globals.css (build green). Bug hit: `*/` inside a comment closed it early — avoid `-*/`
  in CSS comments. Next: 0.3 mobile spec OR 1.1 migrate primitives to tokens.
- 2026-06-27 — 1.1 done. All 6 primitives (Button, Field, Modal, ToggleCard, AmountInput, TagInput)
  now use token utilities (text-ink/body/muted/faint, bg-surface/field, border-line/focus, accent,
  accent-strong, rounded-control/surface/pill, px-section). EXACT-value swaps only → zero visual
  change. Also corrected --color-body 700→600 (matches real label usage). Build green. TagInput glass
  styles intentionally stay inline. Remaining drift NOT yet touched (for 1.2): off-spec shades left raw
  — ToggleCard `border-indigo-200`/`bg-indigo-50`/`bg-indigo-100`/`bg-slate-300`/`text-slate-800`,
  Button `hover:bg-slate-800`, Modal `hover:bg-slate-100`. And rings (#3) live in SCREENS (Dashboard/
  forms/auth/TransactionList), not the 6 primitives — still pending. Next: 0.3 mobile spec, or 1.2
  screen-level drift (rings→border, off-spec indigo shades).
- 2026-06-27 — 0.3 done (DESIGN_SYSTEM.md §6 mobile standards + viewport-fit=cover bug fix, build
  green). 1.3 partial: react-best-practices clean, build green; screenshots blocked (no Chrome
  extension + password-entry rule). New a11y items for backlog: Modal aria-labelledby, close-btn 44px.
