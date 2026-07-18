# Kharcha landing design system

AI-readable source of truth for recreating or extending Kharcha's public marketing experience.
This document describes the landing page's visual language, interaction grammar, responsive
behaviour, motion, subtle gamification, glass treatment, content voice, footer, and implementation
constraints in enough detail for an AI agent to produce work that belongs to the same system.

> Scope: public/editorial surfaces, especially `/landing`.
> Shared product tokens and app/auth rules remain in `specs/DESIGN_SYSTEM.md`.
> Reverse-engineered from `src/app/landing/page.tsx`, `src/app/landing/LandingMotion.tsx`,
> `src/app/landing/landing.module.css`, `src/app/globals.css`, `src/app/layout.tsx`, and
> `public/landing/*`.

---

## 1. One-minute brief for an AI agent

Build a **premium, warm, editorial personal-finance experience** that makes money feel calm,
legible, and human. Use cream as breathing room, charcoal as authority, and gold as a sparse signal
of value or progress. Pair a high-contrast serif display voice with a compact geometric sans UI
voice. Let sections unfold like pages or physical sheets, not like a loud SaaS template.

The page should feel:

- calm, assured, tactile, and financially literate;
- minimal, but never empty or generic;
- premium through proportion, typography, material, and pacing—not ornament volume;
- lightly game-like through progress, orbit, momentum, and achievement cues—not points, streaks,
  confetti, badges, mascots, or casino colour;
- alive through slow ambient motion and precise response to intent—not constant spectacle;
- distinctly Indian through the rupee, `en-IN` formatting, and familiar everyday money language,
  without cliché imagery.

Fast formula:

```text
warm cream canvas
+ charcoal editorial contrast chapters
+ Fraunces display / Manrope interface
+ restrained gold signals
+ original product UI as proof
+ adaptive liquid glass navigation
+ slow ambient motion + short tactile feedback
+ generous vertical pauses
= Kharcha landing language
```

If a concept is visually exciting but increases anxiety, noise, urgency, or financial shame, it does
not belong.

---

## 2. Brand ideology

### 2.1 Core promise: clarity without judgement

Kharcha does not promise instant wealth, hustle, or perfect discipline. It gives people a calmer
view of what is happening now so they can choose what happens next. Design must support awareness,
context, and agency.

### 2.2 Emotional progression

Every long-form page should follow this emotional arc:

1. **Recognition** — simple headline names a familiar money tension.
2. **Relief** — supporting copy removes complexity and judgement.
3. **Orientation** — product preview shows one understandable source of truth.
4. **Capability** — features demonstrate achievable, concrete control.
5. **Human proof** — stories make calm habits socially believable.
6. **Possibility** — closing art widens the idea from tracking money to creating room in life.
7. **Trust** — footer closes with stable, legible, unhurried structure.

### 2.3 Design principles

1. **Clarity before cleverness.** One dominant message per viewport or chapter.
2. **Editorial before dashboard density.** Marketing explains; product preview proves.
3. **Warmth before sterile fintech blue.** Use cream, brown-charcoal, and aged gold.
4. **Gold is punctuation.** It marks progress, emphasis, and direction. It does not fill every CTA.
5. **Charcoal carries commitment.** Primary light-section CTAs use charcoal, never gold.
6. **Depth comes from material.** Frost, hairlines, inset highlights, overlap, and restrained shadows.
7. **Motion reveals structure.** Animation explains hierarchy or momentum; it never delays access.
8. **Gamification stays metaphorical.** Suggest progress and orbit; do not create reward pressure.
9. **Human before aspirational cliché.** Realistic fictional portraits and grounded money language.
10. **Responsive means recomposed.** Mobile is not a scaled desktop screenshot.
11. **Accessibility is part of premium.** Reduced motion, focus visibility, semantic markup, and
    readable contrast are mandatory.
12. **Originality over imitation.** Product art is CSS/HTML and brand-owned assets, never copied
    competitor artwork or slogans.

### 2.4 Anti-patterns

Do not introduce:

- bright fintech blue as brand colour;
- neon gradients, cyber glows, glass on every card, or heavy bloom;
- gold-filled primary buttons with white text;
- multiple competing accent hues;
- generic purple-to-blue SaaS backgrounds;
- large dashboard screenshots without an editorial frame;
- stock photos of coins, piggy banks, handshakes, skyscrapers, or ecstatic investors;
- shame-based copy, scarcity timers, fake counters, streak loss, or aggressive upsell;
- parallax on every layer, long pinned sections, scroll-jacking, or ornamental WebGL;
- tiny mobile desktop layouts, hidden primary actions, or hover-only information.

---

## 3. Source hierarchy and implementation boundaries

When sources disagree, use this order:

1. Live behaviour in `src/app/landing/page.tsx`, `LandingMotion.tsx`, and the final cascading rules
   in `landing.module.css`.
2. Shared semantic values in `src/app/globals.css`.
3. This document.
4. `specs/features/landing.md` for feature intent.
5. `specs/DESIGN_SYSTEM.md` for shared app/auth rules.

Landing uses shared `--c-*` tokens whenever a surface should respond to the active app theme.
Editorial dark chapters intentionally use fixed charcoal/cream values; they remain dark in either
theme to preserve narrative contrast.

Do not create a second independent landing palette. If a new theme-aware value is needed, add or
reuse a semantic `--c-*` token in `globals.css`. Landing-local aliases may describe a role, but must
point back to shared tokens.

Current local aliases:

```css
.page {
  --land-ink: var(--c-ink);
  --land-body: var(--c-body);
  --land-line: var(--c-line);
}
```

---

## 4. Typography

### 4.1 Font inventory

Fonts load through `next/font/google` in `src/app/layout.tsx`.

| Family | CSS variable | Landing status | Role | Fallback |
|---|---|---|---|---|
| **Fraunces** | `--font-heading` | Used | Editorial headlines, italic emphasis, large card quotes, rupee coin | `Georgia, serif` |
| **Manrope** | `--font-geist`, aliased as `--font-body` | Used | Body, navigation, buttons, labels, metadata, cards, footer | `system-ui, sans-serif` |
| **Overpass Mono** | `--font-mono`, aliased as `--font-numeric` | Loaded, available; not currently applied on landing | Future tabular financial details only | `ui-monospace, monospace` |

Do not claim all three appear visually on the current landing page: current rendered system is
Fraunces + Manrope. Overpass Mono is part of shared product typography and may be introduced only
for dense financial numerals or ledger-like metadata where monospacing improves scanning.

### 4.2 Type ideology

- **Fraunces = reflection and meaning.** Use at large scale, normal weight, tight tracking.
- **Manrope = action and comprehension.** Use for everything people operate or scan quickly.
- **Italic Fraunces = emotional turn.** One short phrase per headline may become italic and gold.
- **Uppercase microtype = system cue.** Eyebrows and product labels use small uppercase sans with
  generous tracking.
- **Financial numbers = stable and precise.** Use `tabular-nums`; use Overpass Mono only when a
  ledger/detail context benefits.

### 4.3 Canonical landing type scale

| Role | Family | Size | Weight | Tracking | Line height |
|---|---|---:|---:|---:|---:|
| Hero display | Fraunces | `clamp(58px, 7vw, 96px)` | 400 | `-.065em` | `.91` |
| Hero display, mobile ≤800 | Fraunces | `62px` | 400 | `-.065em` | `.91` |
| Hero display, small ≤450 | Fraunces | `54px` | 400 | `-.065em` | `.91` |
| Section display | Fraunces | `clamp(44px, 5vw, 70px)` | 400 | `-.065em` | `.91–1.04` by chapter |
| Closing display | Fraunces | `clamp(52px, 6vw, 82px)` | 400 | `-.065em` | `.91` |
| Dark feature title | Fraunces | `35px`; `30px` small | 400 | `-.045em` | normal |
| Testimonial quote | Fraunces | `23px`; `19px` small | 400 | `-.04em` | `1.1` |
| Feature row title | Manrope | `21px`; `19px` small | default strong | `-.045em` | normal |
| Lead body | Manrope | `17px`; `15px` small | 400 | normal | `1.65` |
| Section body | Manrope | `15px` | 400 | normal | `1.7` |
| Card body | Manrope | `14px` | 400 | normal | `1.55` |
| Navigation | Manrope | `14px` | 600 | normal | normal |
| Expanded menu link | Manrope | `clamp(24px, 2.6vw, 32px)`; `27px` mobile | 600 | `-.055em` | `1.14` |
| Eyebrow | Manrope | `10px` | 700 | `.16em` | normal |
| Card metadata | Manrope | `8–10px` | 700–800 | `.1–.12em` | normal |
| Footer link | Manrope | `13px` | regular | normal | normal |

### 4.4 Headline construction

- Prefer two short lines over one long line.
- Use sentence case, not title case.
- Allow a deliberate `<br>` where composition matters.
- Italic/gold emphasis should complete or reframe the first line: “Your money. / *In its place.*”
- Avoid punctuation-heavy copy, exclamation marks, claims, and jargon.
- Maximum ideal line width: about 10–14 words for display, 38–55 characters for body.

---

## 5. Colour system

### 5.1 Theme-aware shared palette

Use `var(--c-*)`, never duplicate these hex values inside new theme-aware components.

| Role | Token | Light | Dark |
|---|---|---|---|
| Page cream / darkest app canvas | `--c-bg1` | `#f6f3ea` | `#201b13` |
| Secondary cream / deep canvas | `--c-bg2` | `#efe9db` | `#191613` |
| Main card surface | `--c-surface` | `#fbf8f0` | `#241f17` |
| Primary ink | `--c-ink` | `#201b13` | `#f3efe5` |
| Strong secondary ink | `--c-ink-2` | `#3a332a` | `#ddd6c6` |
| Body | `--c-body` | `#57503f` | `#bcb4a2` |
| Secondary body | `--c-body-2` | `#6b6355` | `#9d9483` |
| Muted | `--c-muted` | `#8a8172` | `#857c6b` |
| Hairline | `--c-line` | `#e7e0d0` | `rgba(243,239,229,.10)` |
| Strong line | `--c-line-strong` | `#d6cdb8` | `#4a4234` |
| Faint fill | `--c-faint` | `#f8f4ea` | `#211c14` |
| Deep readable gold | `--c-accent` | `#8a6d2c` | `#d8b36a` |
| Brand gold | `--c-accent-2` | `#9c7b33` | `#c8a860` |
| Mid gold | `--c-accent-3` | `#b89a54` | `#d8b36a` |
| Highlight gold | `--c-accent-4` | `#d8b36a` | `#eacb8a` |
| Gold wash | `--c-accent-bg` | `#f4ecd8` | `rgba(216,179,106,.16)` |
| Primary CTA | `--c-cta` | `var(--c-ink)` | `var(--c-ink)` |
| Primary CTA text | `--c-cta-fg` | `var(--c-bg2)` | `var(--c-bg2)` |

For alpha-based gold, use `rgb(var(--c-accent-rgb) / alpha)`:

- light triplet: `156 123 51`;
- dark triplet: `216 179 106`.

### 5.2 Fixed editorial dark palette

These values do not theme-flip because dark chapters are intentional narrative anchors.

| Value | Role |
|---|---|
| `#211c15` | Main dark product chapter |
| `#201b13` | Deep card/closing gradient stop |
| `#1d1913` | Legacy footer charcoal |
| `#17130f` | Current footer and closing deepest charcoal |
| `#292219` | Dark card gradient high point / footer brand-mark fill |
| `#30291e` | Tilted demo-card surface |
| `#40301c` | Closing artwork warm radial glow |
| `#f3efe5` | Primary cream-on-dark text |
| `#ddd6c6` / `#e5dece` | Strong secondary cream-on-dark |
| `#bcb4a2` | Body and footer text on dark |
| `#4a4234` / `#3b3328` | Borders and dividers on dark |
| `#b89a54` / `#d8b36a` | Dark-section gold labels and highlights |
| `#7fb88f` | Positive movement in product proof only |
| `#d98a7c` | Expense values in product proof only |

### 5.3 Colour proportions

Aim for this perceived distribution on a light-led page:

- 65–75% warm cream and cream-derived space;
- 15–25% charcoal contrast chapters and typography;
- 5–8% secondary warm neutrals, borders, shadows, and faint fills;
- 2–4% visible gold;
- under 2% semantic green/red/violet, confined to financial proof.

Gold should usually appear as one of: short rule, italic word, icon stroke, progress segment,
hairline, tiny orbit point, metadata label, or hover underline.

### 5.4 Gradient grammar

Use gradients to create light and temperature, not multicolour branding.

Canonical compositions:

```css
/* Hero: warm paper plus a faint gold atmosphere behind product. */
background:
  radial-gradient(circle at 77% 52%, rgb(var(--c-accent-rgb) / .15), transparent 22%),
  linear-gradient(125deg, var(--c-bg1), var(--c-bg2));

/* Dark feature surface: one warm charcoal family. */
background: linear-gradient(145deg, #292219, #201b13);

/* Final possibility chapter: subtle warmth around artwork. */
background:
  radial-gradient(circle at 78% 50%, #40301c 0, transparent 28%),
  linear-gradient(135deg, #201b13, #17130f);
```

Never combine unrelated hues in one brand gradient.

---

## 6. Shape, depth, spacing, and composition

### 6.1 Shape language

- Primary buttons: `14px` radius.
- Brand mark: `12px` normal, `8px` compact.
- Product preview: `20px` radius.
- Floating status card: `16px` radius.
- Feature cards and testimonial cards: `22px` radius.
- Compact nav: `18px` radius.
- Expanded glass menu: `20px` radius.
- Dark chapter sheet: `48px 48px 0 0` desktop, `28px 28px 0 0` mobile.
- Footer: square edge-to-edge in current final treatment; no floating island gap.
- Pills: `999px`, only for small categorical/progress affordances.

Corners are soft, not bubbly. Large radii belong to large surfaces; controls stay compact.

### 6.2 Shadow grammar

Shadows use warm charcoal or black at low alpha. They are wide and heavily diffused, often with
negative spread. Avoid crisp grey elevation shadows.

Examples:

- preview: `0 27px 62px -29px rgba(32,27,19,.34)`;
- floating card: `0 20px 45px -28px rgba(32,27,19,.4)`;
- chapter edge: `0 -34px 80px -58px rgb(32 27 19 / .58)`;
- glass menu: `0 30px 70px -35px rgb(15 12 8 / .58)` plus inset highlights;
- CTA: `0 12px 22px -18px rgb(32 27 19 / .58)`.

Depth hierarchy:

1. page canvas;
2. full-width editorial sheet;
3. card surface;
4. floating contextual card;
5. sticky glass navigation;
6. expanded glass menu.

### 6.3 Spacing rhythm

Use a loose 4px base with preferred jumps of `8, 12, 16, 20, 24, 28, 32, 40, 56, 64, 80,
96, 112, 130, 150px`. Marketing sections intentionally use larger leaps than product UI.

Canonical widths:

- navigation maximum: `1240px`;
- hero grid maximum: `1280px`;
- narrative and stories maximum: `1180px`;
- proof rail content maximum: `1120px`;
- footer content maximum: `1280px`;
- body-copy measure: `330–440px`;
- expanded menu and compact nav: `480px` maximum.

Canonical section padding:

- hero horizontal: `clamp(20px, 5vw, 80px)`;
- story desktop: `150px 30px`;
- dark chapter final: top `clamp(164px,14vw,224px)`, bottom
  `clamp(130px,10vw,170px)`;
- story follow-up final: top `clamp(145px,12vw,190px)`, bottom
  `clamp(145px,11vw,180px)`;
- closing: `105px max(30px, calc((100vw - 1120px)/2))`;
- footer: `58px clamp(28px,8vw,150px) 25px`.

### 6.4 Composition rules

- Use asymmetry inside a stable grid: hero `.89fr / 1.11fr`, story `.8fr / 1.2fr`, people
  `.85fr / 1.15fr`.
- Place the visual mass opposite short, left-aligned copy.
- Let one element break alignment modestly: tilted preview, shifted testimonial, or overhanging art.
- Use full-width dark/light chapter changes for rhythm, not alternating card backgrounds.
- Keep generous blank intervals before proof grids. Pause is part of hierarchy.
- Align section content to shared max-width rails even when section backgrounds are full bleed.

---

## 7. Responsive system

Landing has two primary breakpoints plus one height adaptation:

| Condition | Meaning | Behaviour |
|---|---|---|
| `>800px` | Desktop/tablet landscape | Editorial multi-column layouts, full scroll-sheet motion |
| `≤800px` | Mobile/tablet portrait | Single-column reflow, short translation-only sheets, compact menu |
| `≤450px` | Small phone | Reduced type/spacing, two-column proof rail, simplified decorative art |
| `801px+` and viewport height `≤820px` | Short desktop | Compress hero vertical spacing so proof rail remains visible |

### 7.1 Desktop rules

- Hero tries to fit one viewport: `min-height: calc(100svh - 78px)`.
- Product preview remains layered and pointer-reactive.
- Primary narrative sections use two columns.
- Dark product cards use two equal columns.
- Footer uses `2fr repeat(3,1fr)`.
- Sheet transitions may use clip path, shallow `rotationX`, scale, and vertical translation.

### 7.2 Mobile ≤800px

- Hero becomes natural-height; copy precedes product visual.
- Navigation width remains `calc(100vw - 32px)` and compact height becomes `54px`.
- Desktop nav links/actions disappear; menu toggle stays available.
- Hero visual height becomes about `410px`; preview fills available width.
- Narrative, dark feature, and stories grids become one column.
- Proof items wrap/recompose into three centred max-content columns.
- Dark chapter radius becomes `28px`; vertical padding shortens deliberately.
- Scroll-sheet effects become short `y` translations only. No mobile scale/rotation/clip animation.
- Closing artwork moves below/behind copy as an absolutely positioned layer; CTA remains visible.
- Footer becomes two columns; brand spans full width.

### 7.3 Small phone ≤450px

- Hero display: `54px`; body: `15px`.
- Product preview sidebar narrows to `77px`; internal typography and padding shrink.
- Proof rail becomes two columns.
- Feature row grid compresses from `50/1fr/30` to `32/1fr/18`.
- Testimonial cards remain side by side with smaller gaps and type; do not hide either card.
- Closing decorative shape is removed; freedom artwork stays as the metaphor.
- Footer remains two columns; last group may span full width.

### 7.4 Responsive quality bar

- No horizontal scroll.
- Primary action visible and tappable in every layout.
- No information exists only on hover.
- Mobile is reflowed, never `transform: scale(...)` of desktop.
- Decorative content may fade or reposition, but core copy, proof, navigation, and CTA stay.
- Preserve at least `20px` edge breathing room on small screens and `16px` around floating nav.
- Interactive targets should reach roughly `44px`; compact visuals may use larger invisible hit areas.

---

## 8. Component language

### 8.1 Brand lockup

An inline rupee mark plus `Kharcha` wordmark:

- Manrope, `18px`, `700`, `-.04em`;
- mark: `37×37px`, 1px border, 12px radius, warm surface, restrained shadow;
- compact state: wordmark `16px`/`600`, mark `28×28px`, 8px radius, translucent light fill;
- dark context: cream text, faint cream border, translucent white mark fill.

Do not replace rupee mark with generic wallet/coin icon. This lockup connects name, locale, and
product purpose in one compact form.

### 8.2 Navigation: subtle to liquid glass

State model:

1. **Initial** — full-width, 64px-high restrained translucent bar.
2. **Compact after 72px scroll** — 480×56px desktop or viewport-minus-32×54px mobile glass bar.
3. **Expanded** — compact bar plus independent sibling glass menu below.
4. **On dark** — cream controls and optically denser/darker glass.

Interaction rules:

- Scroll tone is sampled from the section under nav centre using `elementsFromPoint` and
  `[data-nav-tone="dark"]`.
- Hover may preview menu only when compact; click/tap pins it open.
- A 12px invisible pointer bridge spans nav-to-menu gap.
- Pointer leave waits `220ms` before closing unless pinned.
- Escape and menu-link activation close menu.
- `aria-expanded`, `aria-label`, and `aria-hidden` mirror actual state.
- Nav and menu are sibling backdrop roots; never nest the menu under a filtered glass element.

Expanded links use Manrope, not Fraunces. Gold appears only on hover and on the directional arrow.

### 8.3 Hero

Hero anatomy:

1. gold eyebrow and short rule;
2. two-line Fraunces promise with one italic/gold turn;
3. one calm supporting paragraph;
4. one primary charcoal CTA;
5. human trust cue with overlapping portraits;
6. original CSS product preview;
7. ambient orbit/coin/status layers;
8. attached money-area proof rail.

The preview must look like the product, but remain a simplified marketing composition. It is not a
bitmap screenshot. Use real semantic colours only inside the small money tiles: credit green,
expense red, investment violet.

### 8.4 Primary CTA

- Light context: `--c-cta` charcoal fill + `--c-cta-fg` cream text.
- Dark closing context: `#f3efe5` fill + `#201b13` text.
- Minimum hero height: `53px`; horizontal padding: `21px`; radius: `14px`.
- Manrope, bold; arrow is visually larger (`20px`).
- Hover/focus: lift only `1px`, slightly deepen shadow, move arrow `2px`, pass one soft sheen.
- Sheen duration: `.68s`, from off-left to off-right; no repeating idle shine.
- Focus must remain visible. Motion is disabled when reduced motion is requested.

### 8.5 Eyebrow

- Manrope `10px/700`, uppercase, `.16em` tracking.
- Preceded by a `27×1px` gold rule.
- Used once per major chapter.
- Copy names category or context, not marketing hype: “THE MONEY LOOP”, “DESIGNED FOR REAL LIFE”.

### 8.6 Money-area proof rail

Purpose: show scope without turning hero ending into another raised card.

- Attached to hero edge, full width, transparent background, low-contrast top/bottom dividers.
- Five concepts: Spending, Saving, Investing, Bills, Goals.
- Each uses a `16px` uncontained warm-gold line icon, `1.55` stroke, round caps/joins.
- Items are pill-shaped only for hit/hover geometry; idle state has no pill fill.
- Hover: gold text, faint gold wash, `-2px` lift, 1px underline reveal, icon `-1px/-4deg` response.
- Entrance staggers at `.55s + index × .09s`.
- On mobile, rail becomes centred 3-column then 2-column composition.

### 8.7 Narrative feature list

- Two-column chapter: headline/idea left, numbered list right.
- Rows use only hairline separators—no container card.
- Row anatomy: gold two-digit index, title/copy, gold northeast arrow.
- No icon collection needed. Typography and sequence create structure.

### 8.8 Dark product chapter

- Full-width fixed charcoal sheet, visually raised over preceding cream.
- Centred headline and body with generous pause before grid.
- Two large cards with subtle warm-charcoal gradients and 1px borders.
- Inner demo surfaces tilt ±3 degrees as complete physical objects: border, labels, rows, and values
  rotate together. Do not keep text level while only a decorative pseudo-shell rotates.
- Use semantic green/red only for small financial proof values.
- Dark sheet begins rounded and resolves nearer full-width as user scrolls.

### 8.9 Human-story cards

- Realistic fictional portraits, circular crop, descriptive alt text.
- Paired cards create social proof without a carousel.
- Card 2 shifts down `35px` on larger screens for editorial rhythm.
- Fraunces quote, Manrope identity/location.
- Quotes should describe awareness, reduced guilt, or fewer surprises—not miraculous outcomes.
- Portraits are AI-generated fictional people; never imply real endorsements.

### 8.10 Closing freedom chapter

- Fixed dark gradient, normal document flow.
- Left: readiness eyebrow, large possibility-led headline, short copy, inverted cream CTA.
- Right/below: supplied chrome-hands 3D cutout as metaphor for space and freedom.
- Artwork container drifts only `-7px` vertically with `1.008` scale over `7s`.
- Horizontal alpha mask dissolves cropped wrists at both edges: transparent → 18% at 6% → opaque
  at 21–79% → 18% at 94% → transparent.
- Mobile moves art below copy and lowers opacity; CTA must not be covered.
- Do not animate the image pixels or add extra particles. Container drift is enough.

### 8.11 Footer

Footer is a final architectural chapter, not a small legal strip.

Desktop anatomy:

- edge-to-edge `#17130f` background;
- maximum `1280px` inner rail;
- top grid `2fr repeat(3,1fr)`;
- brand column: lockup, two-line promise, X and Instagram;
- three link groups: Product, Company, Support;
- group headings in small tracked gold;
- links/body in quiet cream-grey;
- bottom row separated by one dark hairline: copyright left, Terms/Privacy right.

Mobile anatomy:

- two-column link grid;
- brand spans full width first;
- bottom row stacks vertically;
- last group may span full width on smallest phones;
- no floating margin, card shadow, newsletter trap, giant logo, or decorative gradient.

Social icons:

- `30×30px` circular hairline targets;
- X first, Instagram outline second;
- no generic third placeholder;
- Instagram uses a recognizable rounded-square/circle/dot outline at `14px`.

Footer tone is settled, factual, and useful. It closes trust through order.

---

## 9. Glassmorphism system

Glass is reserved for navigation and floating contextual UI. It is not the default card material.
Good glass lets page colour remain visible while text stays crisp.

### 9.1 Material layers

Every premium glass surface combines:

1. context-tinted translucent base;
2. a radial white highlight near top edge;
3. a faint directional white gradient;
4. translucent 1px border;
5. inset top/side specular lines;
6. wide low-alpha shadow;
7. backdrop blur and modest saturation;
8. optional brightness/contrast reduction over visually busy dark backgrounds.

### 9.2 Compact light nav recipe

```css
border: 1px solid rgb(255 255 255 / .24);
background-color: color-mix(in srgb, var(--c-surface) 38%, transparent);
background-image:
  radial-gradient(ellipse at 20% -45%, rgb(255 255 255 / .58), transparent 48%),
  linear-gradient(135deg, rgb(255 255 255 / .13), rgb(255 255 255 / .035));
box-shadow:
  0 14px 34px -23px rgb(15 12 8 / .42),
  inset 0 1px 0 rgb(255 255 255 / .52),
  inset 0 -1px 0 rgb(255 255 255 / .10);
backdrop-filter: blur(24px) saturate(1.3);
```

### 9.3 Compact dark nav recipe

```css
border-color: rgb(243 239 229 / .16);
background-color: rgb(24 21 17 / .22);
background-image:
  radial-gradient(ellipse at 18% -42%, rgb(255 255 255 / .20), transparent 48%),
  linear-gradient(135deg, rgb(255 255 255 / .07), rgb(255 255 255 / .018));
box-shadow:
  0 15px 38px -22px rgb(0 0 0 / .55),
  inset 0 1px 0 rgb(255 255 255 / .19),
  inset 0 -1px 0 rgb(255 255 255 / .045);
backdrop-filter: blur(26px) saturate(1.28) brightness(.84);
```

### 9.4 Expanded menu recipe

Light menu uses a more legible `67%` surface mix, `30px` blur, `1.32` saturation, and stronger
inset highlights. Dark menu uses roughly `rgb(25 21 17 / .60)`, up to `72px` blur, reduced
saturation/brightness/contrast, and cream text shadow. Heavy dark diffusion is intentional: large
headings moving beneath become atmosphere rather than competing letters.

Critical implementation rule: header and menu must be **sibling surfaces**. If a filtered parent
contains another `backdrop-filter`, browser compositing can prevent inner surface from sampling the
page correctly.

### 9.5 Glass restraint rules

- Use glass only when something floats over changing content.
- Static content cards use opaque warm surfaces.
- Avoid blur above `30px` except dark expanded menu where background suppression needs `72px`.
- Never use thin white text over bright transparent glass without verifying contrast.
- Include `-webkit-backdrop-filter` with standard property.
- Keep a usable opaque/translucent fallback if blur is unsupported.
- Do not stack more than two visible glass layers.

---

## 10. Motion system

### 10.1 Motion ideology

Motion has three jobs:

- **reveal** hierarchy;
- **respond** to direct intent;
- **suggest** calm ongoing progress.

Use one dominant motion idea per component. Slow ambient loops live behind content; fast tactile
motion follows hover, focus, pointer, or scroll. Nothing important waits for animation.

### 10.2 Easing and timing vocabulary

| Token-like value | Use |
|---|---|
| `cubic-bezier(.22,1,.36,1)` | Primary reveal/response; fast start, soft landing |
| `cubic-bezier(.45,0,.55,1)` | Symmetric ambient float |
| `ease-in-out` | Long, low-amplitude artwork drift |
| `linear` | Orbits only |
| `.2–.3s` | Colour, arrow, underline, compact interaction |
| `.35–.55s` | Menu morph/open and material transitions |
| `.65–1s` | Entrance reveal |
| `1.7s` | Graph line draw |
| `5.6–7s` | Ambient float/drift |
| `24–31s` | Background orbit |

### 10.3 Hero entrance choreography

- overall copy opacity: `.9s`, delay `.08s`;
- individual lines rise `18px` over `.85s`;
- delays: eyebrow `.08s`, headline `.16s`, body `.25s`, CTA `.34s`, trust `.43s`;
- preview reveals over `1s` after `.18s` using opacity + clipped inset + `8px` blur;
- floating card reveals over `.9s` after `.65s` from a 30% inset clip;
- graph line draws over `1.7s` after `.75s` using stroke dash offset;
- bars rise over `.7s`, staggered `.08s` from `.70s` through `1.10s`;
- proof items enter over `.65s`, staggered `.09s` starting `.55s`.

Total choreography remains under roughly 2.5 seconds and content is readable immediately.

### 10.4 Pointer-reactive hero depth

Normalize pointer position to `-1…1`, update in `requestAnimationFrame`, and write CSS variables:

| Layer | X response | Y response | Depth/tilt |
|---|---:|---:|---|
| Main preview | `±8px` | `±8px` | `rotateX` up to `∓1.5deg`; `rotateY` up to `±1.8deg` |
| Floating status card | `∓12px` | `∓10px` | `translateZ(38px)` |
| Rupee coin | `∓15px` | `∓12px` | `translateZ(55px)` + `12deg` rotation |

Use a `1100px` perspective. Reset all variables to zero on pointer leave. Disable on reduced motion.
On mobile, remove pointer transition dependence.

### 10.5 Ambient gamified motion

- Rupee coin: vertical float of `11px`, `5.6s`, infinite, compositor-only `translate`.
- Primary orbit: clockwise `24s` linear.
- Secondary dashed orbit: counter-clockwise `31s` linear.
- Closing artwork: `-7px` drift and `1.008` scale at midpoint, `7s` ease-in-out.
- Orbit and dots remain behind preview; they never cross readable chart/content.

### 10.6 Scroll-sheet transitions

Desktop dark chapter enters from:

```text
clip inset: 2.4% left/right, 54px top corners
rotationX: 3.2deg
scale: .965
y: 92px
→ full width, rotation 0, scale 1, y 0
scroll: top 98% → top 24%
scrub: 1.15
```

Light story follow-up rises `96px → 0` from `top 100% → top 14%`, scrub `1.1`. It never scales,
clips, or rotates, preventing dark gutters around its square boundary.

Mobile dark chapter moves `48px → 0`; follow-up moves `64px → 0`. Both are translation-only with
shorter scroll ranges and scrubs `.75/.8`.

### 10.7 Smooth scroll

Lenis settings:

```text
duration: 1.08
easing: 1 - (1 - value)^4
lerp: .085
wheel multiplier: .9
touch multiplier: 1.1
anchor offset: -104px
```

Lenis and GSAP/ScrollTrigger are not initialized for reduced-motion visitors.

### 10.8 Reduced motion contract

Under `prefers-reduced-motion: reduce`:

- disable Lenis;
- do not initialize GSAP sheet transitions;
- remove entrance, orbit, coin, graph, bar, proof, and closing-art animations;
- remove CTA sheen/transform transitions;
- stop hero pointer response;
- use stable final layouts;
- decorative static tilt may remain only where it is not produced by motion; current preview keeps
  its small `-4deg` composition while demo-card reduced-motion rules may flatten tilt.

Reduced motion must not remove content or actions.

---

## 11. Minimal, subtle gamification

Kharcha uses the visual language of progress without turning finance into competition.

### 11.1 Current mechanics

- **Orbit** — money areas belong to one connected system.
- **Moving rupee token** — money is active, tangible, and local.
- **Graph drawing and bar growth** — information becomes legible over time.
- **Four-of-five progress rail** — “On track” shows direction without a score.
- **Area rail** — Spending, Saving, Investing, Bills, Goals feel like explorable capabilities.
- **Arrow movement** — calls to action imply the next small step.
- **Numbered features** — creates progression through a story without locking content.
- **Sheet reveals** — each chapter feels earned through natural reading progress.
- **Positive delta** — a small contextual outcome, not a celebration takeover.

### 11.2 Rules for new gamified elements

- Reward comprehension or completion, never repeated app opening.
- Prefer progress states: `not started → in view → on track → complete`.
- Show consequences and context, not arbitrary points.
- Do not compare users, rank performance, or shame missed goals.
- Never use loss aversion through broken streaks or expiring rewards.
- Keep celebration within the component that changed; no full-screen confetti.
- One gold signal is enough. Semantic success green may communicate actual financial meaning.
- Ambient elements must stay behind copy and never steal pointer input.
- Any animated progress needs an equivalent static text state.

### 11.3 Allowed extensions

- a quiet ring completing around a goal;
- a small bar settling into “on track”;
- a rupee token moving between income, bills, spending, and future;
- a short numeric count-up for user-triggered results, with final value immediately accessible;
- a gentle check or line draw after explicit completion.

### 11.4 Forbidden extensions

- XP, coins as currency, loot boxes, daily streak pressure;
- leaderboards or “better than 80% of users”;
- red alert theatre for normal spending;
- slot-machine numbers, bouncing CTAs, pulsing badges, or infinite button shine;
- celebratory animation for merely viewing marketing content.

---

## 12. Imagery, illustration, and iconography

### 12.1 Product imagery

Prefer original HTML/CSS compositions that echo real product structure. Benefits: theme-aware,
responsive, accessible, and visibly part of Kharcha. Use screenshots only when exact workflow proof
matters more than art direction.

### 12.2 Portraits

- warm, natural, realistic fictional people;
- circular crops; no hard studio-white cutouts;
- diverse without tokenistic staging;
- descriptive alt text names fictional status;
- trust stack uses `29–30px` faces with `-8px` overlap and cream borders;
- story cards use `68px` faces.

Current files: `testimonial-meera.png`, `testimonial-aarav.png`, `testimonial-riya.png`.

### 12.3 Freedom artwork

`freedom.jpg` is source; `freedom-cutout.png` is deterministic alpha-cutout derivative. Keep source
unchanged. Artwork's chrome hands are a metaphor for possibility, not a product screenshot. Preserve
transparent matte removal and directional wrist fade.

### 12.4 Icons

- simple, geometric, line-based;
- `1.5–1.55px` stroke at 14–16px visual size;
- round caps and joins;
- no filled icon container unless a material/status role requires it;
- gold for capability/direction, semantic colours only for actual money meaning;
- arrows: `→` for forward action, `↗` for discovery or section progression.

---

## 13. Content and voice

### 13.1 Voice attributes

- calm;
- plainspoken;
- thoughtful;
- concise;
- optimistic without hype;
- knowledgeable without sounding like a bank or finance influencer.

### 13.2 Copy patterns

Good headlines:

- “Your money. In its place.”
- “Less chasing. More knowing.”
- “Everything you need. Nothing you do not.”
- “Make space for what matters.”

Good body structure: name benefit, remove pressure, show agency.

```text
Kharcha brings [everyday money inputs] into [one calm view]
so you can [make a grounded decision].
```

Good CTAs:

- Start tracking
- Start free
- Start with Kharcha
- See how it works

Avoid:

- “Crush your financial goals”;
- “Unlock wealth”;
- “Become financially unstoppable”;
- “You are wasting money”;
- “Act now”;
- excessive exclamation marks or fake urgency.

### 13.3 Number and locale rules

- Currency symbol: `₹`.
- Locale: `en-IN`.
- Prefer believable rounded examples; avoid unbelievable wealth claims.
- Use minus signs for spend (`−₹2,840`) and contextual arrows/deltas for movement.
- Label time context (“THIS MONTH”, “June 2026”) near values.

---

## 14. Interaction and accessibility

- Semantic sections, headings in order, nav landmark, footer landmark.
- Links for navigation; buttons for state changes.
- Provide clear accessible names for icon-only controls and social links.
- Keep `aria-expanded`, `aria-hidden`, and labels synchronized for menu.
- Escape closes expanded menu.
- Focus-visible style must survive glass and dark backgrounds.
- Touch targets aim for `44×44px`; menu toggle visual is `40×40px` and should receive adequate
  surrounding hit area.
- Never convey money semantics by colour alone; pair with labels and signs.
- Decorative orbit/art uses `aria-hidden`; product preview has a descriptive label.
- Portraits use useful alt text; purely decorative images use empty alt.
- Respect `prefers-reduced-motion` comprehensively.
- Body copy should remain at least `15px` on small mobile.
- Test foreground/background combinations when altering glass opacity or chapter colours.
- Smooth scrolling must not break anchors, keyboard navigation, or browser history.

---

## 15. Performance and implementation

- Prefer CSS transforms/opacity for continuous animation.
- Pointer motion writes CSS variables inside `requestAnimationFrame`.
- Use passive scroll listeners.
- Cancel RAF/timeouts and remove every listener on cleanup.
- Revert GSAP match media and destroy Lenis on unmount.
- Avoid layout-triggering per-frame properties; rupee float uses compositor `translate`.
- Keep ambient layers `pointer-events: none`.
- Use `overflow: clip` where chapter art must not create horizontal scroll.
- Reserve visual height so async images do not shift layout.
- Use `next/image` dimensions and responsive `sizes`.
- Do not add WebGL for effects achievable with CSS/GSAP.
- Fixed `will-change` is acceptable only on known active sheet layers; remove/avoid it on large
  idle surfaces where possible.
- Maintain nav as highest page layer, but do not spread extreme z-index values through other UI.

Current motion stack:

- CSS keyframes/transitions for entrance, hover, orbit, graphs, and ambient drift;
- GSAP + ScrollTrigger for bounded chapter-sheet transitions;
- Lenis for smooth wheel/anchor movement;
- native pointer/scroll listeners for hero depth and nav adaptation.

---

## 16. AI-agent implementation protocol

When asked to add a landing section or produce a related page:

1. Read `specs/features/landing.md`, this file, and `specs/DESIGN_SYSTEM.md`.
2. Inspect final cascading rules in `landing.module.css`; repeated selectors exist and later rules
   win.
3. State new section's job in the emotional progression.
4. Choose one dominant visual idea and one motion idea.
5. Reuse shared colours and font variables.
6. Start from small-screen composition, then define `>800px` enhancement.
7. Add dark-tone marker if nav passes over a fixed dark surface.
8. Add reduced-motion static state before considering work complete.
9. Verify keyboard, focus, anchors, touch targets, and no horizontal overflow.
10. Update `specs/features/landing.md` when as-built behaviour changes.

### 16.1 Decision tree

```text
Need colour?
├─ Brand emphasis → shared gold token
├─ Primary action → charcoal/cream CTA pair
├─ Financial meaning → semantic green/red/violet
└─ Surface/text/line → shared warm neutral token

Need depth?
├─ Floating over changing content → restrained glass
├─ Static content → opaque warm surface + hairline
├─ Editorial transition → full-width overlapping sheet
└─ Decorative emphasis → small tilt or overlap, not another shadow stack

Need motion?
├─ Direct interaction → .2–.4s tactile response
├─ Entrance → .65–1s reveal, short stagger
├─ Ambient metaphor → 5–31s low-amplitude loop
├─ Chapter transition → bounded scrubbed translation/sheet reveal
└─ No clear structural job → do not animate
```

### 16.2 Definition of done

Visual:

- [ ] Warm cream/charcoal/gold system; no rogue brand hue.
- [ ] Fraunces only for editorial meaning; Manrope for UI and reading.
- [ ] One clear focal point per chapter.
- [ ] Gold remains sparse.
- [ ] Primary CTA is charcoal on light or cream on dark, never gold with white.
- [ ] Glass is limited to floating/adaptive surfaces.
- [ ] Dark chapter remains intentionally fixed dark.
- [ ] Spacing preserves editorial pauses.

Responsive:

- [ ] Works at `>800`, `≤800`, and `≤450` widths.
- [ ] No horizontal overflow.
- [ ] Mobile reflows instead of shrinking desktop.
- [ ] Main CTA and navigation stay available.
- [ ] Footer remains complete and legible.

Motion:

- [ ] Motion has a named reveal/respond/suggest job.
- [ ] Continuous motion uses transforms/opacity.
- [ ] No decorative layer crosses readable content.
- [ ] Reduced-motion state is static and complete.
- [ ] Listeners, Lenis, GSAP, RAF, and timers clean up.

Content/accessibility:

- [ ] Copy is calm, clear, and non-judgemental.
- [ ] Rupee and `en-IN` context are correct.
- [ ] Heading order and landmarks make sense.
- [ ] Focus and keyboard interactions work.
- [ ] Icons/images have appropriate labels or hidden semantics.
- [ ] Financial meaning is not colour-only.

### 16.3 Compact generation prompt

Use this when handing visual work to another agent:

```text
Create a Kharcha marketing surface in a premium warm editorial system. Use theme-aware cream and
charcoal neutrals, fixed charcoal for narrative dark chapters, and sparse aged gold only as
punctuation. Use Fraunces 400 with tight tracking for large reflective headlines; use Manrope for
all UI, body, labels, navigation, and actions. Primary CTAs are charcoal-on-cream or inverted
cream-on-charcoal, never gold-filled. Build depth from hairlines, overlapping full-width sheets,
subtle warm shadows, and liquid glass only for floating navigation/context. Motion must reveal,
respond, or suggest calm progress: short soft landings, slow low-amplitude ambient loops, and a
complete prefers-reduced-motion state. Gamification should imply progress, orbit, and momentum
without points, streaks, pressure, confetti, or competition. Recompose at 800px and 450px; preserve
navigation, CTA, meaning, and footer. Voice is calm, concise, non-judgemental, en-IN, and rupee-led.
```
