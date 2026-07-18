# Landing page

## Problem

`/landing` is Kharcha's public marketing page. It turns the existing premium warm product identity into an approachable first impression and guides visitors to sign up or log in.

## UI behaviour

- Public, responsive page at `/landing`; no authentication needed.
- `LandingMotion.tsx` creates Lenis smooth-wheel/anchor scrolling (disabled by `prefers-reduced-motion`) and adds scroll-reactive nav states. Nav sits at page root with the page's highest z-index, so it stays above every hero, card and footer layer. It begins full-width/subtle and compacts after 72px into a restrained 480px × 56px liquid-glass bar. Dark sections declare `data-nav-tone="dark"`; the motion controller detects the section beneath the nav and switches brand, menu and toggle text to cream, returning them to charcoal over light sections. Sticky shell contains the glass header and expanded menu as sibling surfaces, preventing nested `backdrop-filter` roots from disabling menu blur. Both surfaces therefore sample the page independently with adaptive translucent tints and specular inset highlights. Dark expanded glass uses stronger optical diffusion and reduced backdrop brightness so oversized background headings become atmosphere while menu copy remains crisp. A small pointer bridge and close grace keep the menu open while moving from the compact bar into its links; click/tap pins it open, and Escape/link selection closes it. Menu links use the compact Manrope UI voice and gold hover accent rather than display-scale type.
- Hero uses editorial Kharcha messaging, product dashboard-inspired CSS artwork, and a charcoal primary CTA. The `Start tracking` CTA uses a small gold progress rail, an arrow token and a hover-only sparkle to suggest forward motion without leaving the premium Kharcha system. Its preview responds gently to pointer position, graph/bars animate into place, and orbiting money elements create restrained game-like depth. The floating rupee uses compositor-only `translate` motion so it does not trigger per-frame layout. Orbit dots are children of their ring, remain on-axis, and travel behind the dashboard layer rather than crossing its chart. A fully visible attached rail closes the hero with animated Spending, Saving, Investing, Bills and Goals markers. All hero motion stops under `prefers-reduced-motion`.
- Sections cover money loop, product proof, a dark-feature contrast section, AI-generated fictional customer portraits, an animated money-world final CTA and a full-width multi-column footer.
- Light/dark colour values use shared `--c-*` tokens where theme-aware; dark feature/footer surfaces are intentionally fixed charcoal to retain their editorial contrast.
- Dark feature demo cards keep all labels and values on the native pixel grid for sharp rendering; only a separate decorative background shell receives the playful rotation.
- Footer social row contains X followed by a recognizable Instagram outline icon; no third social placeholder is shown.
- Mobile collapses navigation and section grids without hiding primary actions.

## Design constraints

- Warm cream/charcoal system, sparse gold accents, Fraunces display voice and Manrope UI voice.
- Primary CTA stays `--c-cta`, never gold.
- Product preview is original CSS composition. No copied brand artwork or marketing copy.

## Reverse-engineered from

`src/app/landing/{page.tsx,LandingMotion.tsx,landing.module.css}`, `public/landing/testimonial-{meera,aarav,riya}.png`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`.
