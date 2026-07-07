# DESIGN_SYSTEM — next-ver

The shared visual language for the app's UI and the **source of truth** for color, type, and
components.
Before styling a new screen or dialog, follow the existing live dashboard patterns and pull color/type from here.
Do not add wrapper components until repeated live usage justifies them.

> Reverse-engineered from `src/app/globals.css` (theme tokens), `src/features/theme/ThemeContext.tsx`,
> `src/features/dashboard/mobile/AvatarMenu.tsx`.

## Dark mode (theme tokens)

The dashboard components style with **inline CSS `var(--c-*)` tokens**, not raw hex. All color
tokens are declared twice in `globals.css`: `:root` (light — values equal the historical hex, so
light is unchanged) and `html.dark` (dark overrides). A single `dark` class on `<html>` flips the
whole app.

- **Provider:** `ThemeContext.tsx` (`ThemeProvider` + `useTheme`). Preference order: explicit user
  choice in `localStorage['ft-theme']` → OS `prefers-color-scheme`. `toggle()` collapses "system"
  to an explicit light/dark. It only toggles the `<html>.dark` class; tokens do the rest.
- **Anti-flash:** `THEME_SCRIPT` (exported from `ThemeContext`) is injected as a blocking inline
  `<script>` in `layout.tsx` `<head>`; it sets the class before paint. `<html suppressHydrationWarning>`.
- **Toggle UI:** in `AvatarMenu` (avatar dropdown, shared by mobile `GreetingHeader` and
  `DesktopHome`) — Dark mode switch + Log out.
- **Token families** (`--c-*`): surfaces (`surface`, `glass`, `glass-strong`, `bg1/bg2`), text
  (`ink`, `ink-2`, `body`, `body-2`, `muted`), lines (`line`, `line-strong`, `field`, `faint`),
  accent indigo (`accent`, `accent-2..4`, `accent-bg`), `violet-*`, `credit-*`, `expense-*`, plus
  `onaccent` (white text on colored CTAs — stays white in both themes).
- **Adding new UI:** use `var(--c-*)` for any color that must adapt. Never hardcode a slate/white
  hex inline. `rgba(99,102,241,…)` indigo tints and `rgba(15,23,42,…)` shadows are left literal
  (they read acceptably on both themes).

> Context: an earlier shared primitive layer was retired after the live app moved to high-fidelity mobile sheets.
> Keep new UI aligned with the current sheets and tokens, not with deleted wrappers.

## 0. Principles (read first)

1. **One accent: indigo.** `indigo-500/600` is the *only* brand hue — toggles, focus, active
   state, the AmountInput cue. Don't introduce a second solid brand color.
2. **Color comes through glass, not paint.** When something needs to read as "colorful"
   (category tags, status pills), use the **Glass treatment** (§2): a translucent tint + frost +
   deep-family text. **Never opaque, saturated fills with white text** — that look was explicitly
   rejected. Glassy / semi-transparent is the house style. (See DECISIONS D11.)
3. **Neutral by default.** Surfaces and text are `slate-*`. Most of the UI is white + slate;
   indigo and glass are accents, used sparingly.
4. **No layout shift, no fake delay.** Reserve slot heights; motion is fast and honest (D9/D10).
5. **Flat focus.** Inputs focus by **border color only** — no `box-shadow`, no ring, no glow
   (D12). The whole UI avoids drop shadows on controls; depth comes from surface/border, not glow.

## 1. Tokens — color & layout

| Category | Value | Notes |
|----------|-------|-------|
| Accent (brand) | `indigo-500` / `indigo-600` | **The only** brand hue: toggles, focus, active chips, AmountInput cue. |
| Neutral | `slate-*` | Surfaces & text. |
| Text — primary | `slate-900` | Headings, input values. |
| Text — body | `slate-600/700` | Labels, secondary buttons. |
| Text — muted | `slate-500` | Subtitles. **Not** `slate-400` (contrast). |
| Text — placeholder | `slate-400` | Placeholders, hints only. |
| Field surface | `bg-slate-50` + `border-slate-200` | Idle input. |
| Field focus | `border-indigo-400` + `bg-white` (no ring, **no box-shadow**) | All inputs. Border-color change only. Ring removed D10; the AmountInput settle glow removed D12. |
| Semantic — error | `bg-red-50` + `text-red-600` | Inline error row only. |
| Radius — control | `rounded-xl` | Inputs, buttons, chips containers. |
| Radius — pill | `rounded-full` | Tags, quick-pick chips. |
| Radius — surface | `rounded-3xl` (sheet/card) | Modal shell. |
| Field gap | `gap-5` (20px) | Vertical rhythm between form fields. |
| Section padding | `px-6` (24px) | Modal body horizontal. |
| Heading | `text-2xl font-semibold` Bricolage Grotesque | Modal title. |
| Label | `text-sm font-medium text-slate-600` | Field label. |

## 2. Glass treatment (the colorful layer)

The house aesthetic for anything that carries a category color: **glassmorphism**, not solid
paint. Frosted, semi-transparent, the surface behind shows through. Default intensity is the
**stronger-frost** preset below.

Per-hue recipe (`rgb` = the hue's 0-255 triple; `text` = its deep shade for WCAG AA on the tint):

```css
color: <text>;                                  /* deep family shade, e.g. orange-800 #9a3412 */
background-image: linear-gradient(135deg,
  rgb(<rgb> / 0.30) 0%, rgb(<rgb> / 0.15) 100%); /* translucent tint, slight gradient */
border: 1px solid rgb(<rgb> / 0.45);            /* translucent colored hairline */
backdrop-filter: blur(14px) saturate(1.7);      /* the frost — also -webkit- */
box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 0.6),  /* top sheen */
            0 1px 2px 0 rgb(15 23 42 / 0.06);        /* faint lift */
```

Reference hues (used by category tags — `TagInput`):

| Token | Hue rgb | Text | Use |
|-------|---------|------|-----|
| glass-food | `234 88 12` (orange) | `#9a3412` | "Food" |
| glass-bills | `37 99 235` (blue) | `#1e40af` | "Bills" |
| glass-shopping | `219 39 119` (pink) | `#9d174d` | "Shopping" |
| glass-neutral | `71 85 105` (slate) | `#334155` | Fallback / custom |

Rules: text is always the **deep family shade** (700/800), never white-on-tint. Keep tints in the
`0.15–0.30` alpha band so the deep text clears ≥4.5:1 over white. Implementation lives in
`TagInput.tsx` (`glassTagStyle`) — reuse/extend it; don't reinvent the math per component.

## 3. Fonts & locale

- **Bricolage Grotesque** — headings *and* form controls (forced in `globals.css` on
  `input/textarea/select/button/label`), with the Next/Geist sans fallback. This gives the app its
  distinct, slightly characterful voice on both display and controls.
- **Body / system text** — `font-sans` (Geist) where Bricolage isn't forced.
- Numerals in amounts/totals use `tabular-nums` for stable width.
- **Locale**: `en-IN`, currency `₹`. Use feature-local formatting helpers and keep rounding consistent with existing dashboard code.

## 4. Live patterns

### Sheets
`AddSheet` and `EditSheet` are the current dialog references.
They use inline tokenized styles, bottom-sheet behavior on mobile, centered card behavior where applicable, and safe-area-aware padding.
When adding a new sheet, start from those files and keep spacing, type scale, backdrop, and operator-bar behavior aligned.

### Amount field
`AmountField` is the shared amount input for add/edit flows.
It accepts arithmetic and owns the calculator/operator-bar integration.
Do not create another amount input unless the interaction is materially different.

### Portfolio and transaction cards
Dashboard cards live under `src/features/dashboard/mobile/` and `src/features/dashboard/desktop/`.
Prefer extracting a shared component only after duplicated live markup creates real maintenance cost.

## 5. Form recipe

New forms should mirror the existing sheet structure:
- Fixed backdrop with click-outside close.
- Tokenized surface, line, text, and accent colors via `var(--c-*)`.
- Stable CTA/operator slot heights to avoid layout shift.
- Inputs with at least 16px text for iOS.
- Safe-area bottom padding for mobile sheets.

## 6. Mobile standards

This is a **mobile-first PWA** (`en-IN`, installable). Phone is the primary target; larger screens
are an uplift, not the baseline. Design for the small screen first, then add `sm:` overrides.

### Breakpoints (Tailwind default scale)
- **Base (no prefix) = phone.** Write the phone layout with unprefixed utilities.
- **`sm:` (≥640px) = the phone→tablet/desktop switch.** This is the app's main breakpoint
  (e.g. `Modal`: bottom sheet on base, centered card at `sm:`). Prefer `sm:` for the layout shift.
- `md:` (≥768px) / `lg:` (≥1024px) only when a third tier genuinely helps. Don't over-tier.

### Touch targets
- **Minimum 44×44px** for any interactive control (Apple HIG; comfortable for thumb). Use `min-h-11`
  (44px) where padding alone doesn't reach it.
- Text buttons clear this already (`Button` is `py-3` → ~48px). ✓
- **Icon-only buttons are the risk.** A 20px icon with `p-2` is only ~36px — below 44. Either bump
  padding or add hit-slop with negative margin (e.g. `-m-1`) so the tap area ≥44 while the visual
  stays compact. *(Known gap: `Modal` close button — fix in migration 1.2.)*
- Space adjacent tap targets ≥8px apart so thumbs don't mis-hit.

### Inputs & iOS
- **Inputs must be ≥16px text** (`text-base`) — smaller triggers iOS auto-zoom on focus. All current
  fields comply (`TextField` `text-base`, `AmountInput` `text-2xl`). Keep it.
- Set honest `inputMode` / `autocomplete` (`AmountInput` uses `inputMode="text"` for arithmetic).
- Numerals use `tabular-nums` (see §3).

### Safe areas (notch / home bar)
- Respect `env(safe-area-inset-*)`. Bottom sheets pad the bottom:
  `pb-[max(1.5rem,env(safe-area-inset-bottom))]` (`Modal` does this). Any fixed top chrome should
  pad the top inset likewise.
- `viewport-fit=cover` must be set for insets to resolve (verify in `app/layout.tsx` viewport meta).

### Interaction
- **No hover-only affordances.** Anything reachable by hover on desktop must be visible/tappable on
  touch. Use `active:` + `transition-colors` for press feedback; don't rely on `:hover`.
- Backdrop-tap and Escape both close modals (`Modal` ✓). Swipe-to-dismiss not implemented — future.
- Respect `prefers-reduced-motion` (e.g. `AmountInput` skips animation). Required for new motion.

### Layout
- Single-column on phone; reserve slot heights to avoid layout shift (D9/D10).
- Bottom sheets for primary actions (thumb reach) — already the `Modal` default on base.
