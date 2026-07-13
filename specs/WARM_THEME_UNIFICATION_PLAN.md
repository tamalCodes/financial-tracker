# Warm theme unification — implementation plan

Status: proposed (2026-07-13).
Owner decision on file: **brand accent = warm gold** (matches the Kharcha auth screen), app-wide.
This is a planning doc, not an as-built spec.
When executed, fold the outcome into `specs/DESIGN_SYSTEM.md` and delete or archive this file.

## 1. Problem

The app currently ships **two disconnected color systems** inside `src/app/globals.css`:

1. **Auth screen** uses a warm token set (`--kh-*`): cream `#f4f1e8`, warm charcoal ink `#201b13`, soft gold `#9c7b33`.
   It is deliberately scoped to `.kh-auth` and walled off with the comment *"Dashboard keeps its indigo system."*
2. **Everything after login** uses a separate, cooler token set (`--c-*`): blue-grey light mode (`#eef2f7` / `#e3e8ef`) and a cool near-black dark mode (`#10141d` / `#0a0d14`), flipped by the `.dark` class on `<html>`.

Because the two systems never meet, the premium warm feel of the login screen disappears the moment a user authenticates.
The dashboard is not "missing a theme" — it is themed, just with the wrong (cool) palette.

## 2. Why this is a small change

The dashboard was already built token-first.

- 26 component files read colors through `var(--c-*)`; almost none hardcode hex.
- The only hardcoded colors found in components are the Google logo brand hexes (`#4285F4` etc.), which must stay.
- So **re-basing the `--c-*` token values onto the warm palette recolors the entire authenticated app in one edit**, with no component churn.

The one stray value outside the token system is `themeColor: "#0f172a"` in `src/app/layout.tsx` (PWA status-bar tint), which must be updated to the warm charcoal.

## 3. Goal

One warm design system, one source of truth.

- The authenticated app (dashboard, sheets, cards, charts) feels the same warm cream/charcoal as the auth screen, in both light and dark mode.
- The auth screen and the app read from the **same** tokens — the `--kh-*` set is retired.
- `specs/DESIGN_SYSTEM.md` documents the warm palette, type scale, and accent rules so any future AI agent inherits the theme automatically.

## 4. Decisions locked

- **Neutrals → warm.** Backgrounds, surfaces, ink, lines, and fields move from cool slate to warm cream / warm charcoal.
- **Brand accent → gold.** Indigo brand usages (buttons, active tabs, links, focus, chart "primary" line) become the auth gold (`#9c7b33` light / `#d8b36a` dark).
- **Transaction semantics stay.** Credit = green, expense = red, investment = violet remain, tuned only if legibility on cream requires it. This preserves the user-confirmed money color language (see `specs/DESIGN_SYSTEM.md` §0, transaction-color memory).
- **Single system.** Auth stops using `--kh-*` and consumes `--c-*` (plus a couple of auth-only layout tokens if needed).

## 5. Proposed token values

Starting values below; each is tuned during Phase 1 to pass WCAG AA for its role (body text ≥ 4.5:1, large/UI ≥ 3:1).
Names are unchanged so components need no edits.

### Light mode (`:root`)

| Token | Old (cool) | New (warm) | Role |
|---|---|---|---|
| `--c-bg1` | `#eef2f7` | `#f6f3ea` | page gradient top |
| `--c-bg2` | `#e3e8ef` | `#efe9db` | page gradient bottom |
| `--c-surface` | `#ffffff` | `#fbf8f0` | cards / sheets |
| `--c-glass` | `rgba(255,255,255,.6)` | `rgba(255,253,247,.6)` | glass fill |
| `--c-glass-strong` | `rgba(255,255,255,.85)` | `rgba(255,253,247,.85)` | strong glass |
| `--c-ink` | `#0f172a` | `#201b13` | headings / values |
| `--c-ink-2` | `#334155` | `#3a332a` | strong secondary |
| `--c-body` | `#475569` | `#57503f` | body |
| `--c-body-2` | `#64748b` | `#6b6355` | body secondary |
| `--c-muted` | `#94a3b8` | `#8a8172` | subtitles / labels |
| `--c-line` | `#e2e8f0` | `#e7e0d0` | default border |
| `--c-line-strong` | `#cbd5e1` | `#d6cdb8` | strong border |
| `--c-field` | `#f1f5f9` | `#f1ecdf` | idle field bg |
| `--c-faint` | `#f8fafc` | `#f8f4ea` | faint fill |
| `--c-accent` | `#4338ca` | `#8a6d2c` | accent text (deep gold, WCAG) |
| `--c-accent-2` | `#4f46e5` | `#9c7b33` | accent (auth gold) |
| `--c-accent-3` | `#818cf8` | `#b89a54` | accent light |
| `--c-accent-4` | `#a5b4fc` | `#d8b36a` | accent lightest |
| `--c-accent-bg` | `#eef2ff` | `#f4ecd8` | flat accent tint |

### Dark mode (`html.dark`)

| Token | Old (cool) | New (warm) |
|---|---|---|
| `--c-bg1` | `#10141d` | `#201b13` |
| `--c-bg2` | `#0a0d14` | `#191613` |
| `--c-surface` | `#171c27` | `#241f17` |
| `--c-glass` | `rgba(30,37,52,.55)` | `rgba(40,34,24,.55)` |
| `--c-glass-strong` | `rgba(30,37,52,.78)` | `rgba(40,34,24,.8)` |
| `--c-ink` | `#e8ecf3` | `#f3efe5` |
| `--c-ink-2` | `#cbd3e0` | `#ddd6c6` |
| `--c-body` | `#aeb8c9` | `#bcb4a2` |
| `--c-body-2` | `#94a0b3` | `#9d9483` |
| `--c-muted` | `#7c8699` | `#857c6b` |
| `--c-line` | `rgba(255,255,255,.09)` | `rgba(243,239,229,.10)` |
| `--c-line-strong` | `#3a4353` | `#4a4234` |
| `--c-field` | `#1c2230` | `#2a2418` |
| `--c-faint` | `#191e29` | `#211c14` |
| `--c-accent` | `#a5b4fc` | `#d8b36a` |
| `--c-accent-2` | `#818cf8` | `#c8a860` |
| `--c-accent-3` | `#a5b4fc` | `#d8b36a` |
| `--c-accent-4` | `#c7d2fe` | `#eacb8a` |
| `--c-accent-bg` | `rgba(99,102,241,.16)` | `rgba(216,179,106,.16)` |

### On-accent nuance (the one real gotcha)

`--c-onaccent` is currently `#ffffff` and rides on top of colored CTAs.
Gold is a mid-tone, so **white text on a solid gold button fails contrast**.
Resolution: keep `--c-onaccent` white for the semantic CTAs (green / red / violet), and give gold primary buttons **dark charcoal text** (matching the auth "Continue" button, which is charcoal-on-cream, not gold).
Practically: gold is used for accents, active states, links, and chart lines; primary filled buttons stay charcoal (`--c-ink` fill, cream text) as on the auth screen.
This gets finalized in Phase 3 while auditing the handful of `+` / CTA buttons.

## 6. Phases

### Phase 0 — Lock the palette
Finalize the hex table in §5 and confirm every text/border role passes WCAG AA on its background.
Adjust `--c-cat-*` category text colors and the transaction greens/reds/violets only if they read poorly on cream.

### Phase 1 — Rebase `--c-*` tokens (the big lever)
Edit the two token blocks in `src/app/globals.css` (`:root` and `html.dark`) to the §5 values.
Update `body { background: var(--c-bg2) }` stays as-is (already tokenized).
Update `themeColor` in `src/app/layout.tsx` to the warm charcoal (`#201b13`).
Update the `.subtle-scroll` and `.ft-skel` fixup rules if their hardcoded slate rgb reads cold on cream.
After this phase the whole authenticated app is already warm.

### Phase 2 — Unify auth onto the shared system
Map the `.kh-auth` / `.kh-auth-page` blocks onto `--c-*` (retire `--kh-*`).
Keep only genuinely auth-layout-specific tokens (split-panel divider, glow) as locals, sourced from `--c-*` where they overlap.
Goal: deleting `--kh-*` leaves the auth screen pixel-identical, now proving both screens share one palette.

### Phase 3 — Accent rollout + on-accent fix
Sweep the 26 `var(--c-*)` consumers for spots where indigo was doing "brand" work (active tab underline, links, focus ring, `TrendChart` primary series, primary `+` buttons).
Confirm they now render gold via the rebased tokens; fix any that hardcoded indigo outside the token set.
Apply the on-accent rule from §5.5 (charcoal-fill primary buttons; white text only on green/red/violet CTAs).

### Phase 4 — Make it the source of truth
Rewrite `specs/DESIGN_SYSTEM.md`:
- Replace "indigo-only accent" with "warm gold accent + warm cream/charcoal neutrals".
- Paste the final token table (§5) as the canonical reference.
- Document the type scale (Bricolage Grotesque display, Geist body), radius, spacing already in `@theme`.
- Add the on-accent rule and the "one system, no `--kh-*`" note.
Update `specs/INDEX.md` DESIGN_SYSTEM row and `specs/DESIGN_SYSTEM_MIGRATION.md` with this migration.
Update `specs/features/auth.md` to note auth now shares `--c-*`.

### Phase 5 — Verify
Check auth + dashboard in light and dark, both mobile and desktop breakpoints.
Confirm: no cool-grey leftovers, charts/legend legible on cream, CTA contrast passes, no white-flash on load (THEME_SCRIPT still correct).

## 7. Files touched

- `src/app/globals.css` — token rebase (Phase 1), auth unification (Phase 2). Primary change.
- `src/app/layout.tsx` — `themeColor` meta.
- Possibly `src/features/auth/components/AuthForm.tsx` — only if it references `--kh-*` names directly.
- `src/features/dashboard/desktop/TrendChart.tsx` — verify chart series colors resolve from tokens.
- Specs: `DESIGN_SYSTEM.md`, `INDEX.md`, `DESIGN_SYSTEM_MIGRATION.md`, `features/auth.md`.

## 8. Risks / watch-items

- **Gold contrast.** Mid-tone gold is the trickiest color; the on-accent rule (§5.5) is the mitigation.
- **Glass over cream.** Translucent white glass over warm cream can look slightly grey; tune glass rgb warm (done in §5).
- **Chart legibility.** Emerald/red/violet series on cream — verify the trend chart still separates cleanly.
- **No regression to auth.** Phase 2 must be pixel-identical before `--kh-*` is deleted.
