# Landing page

## Problem

`/landing` is Kharcha's public marketing page. It turns the existing premium warm product identity into an approachable first impression and guides visitors to sign up or log in.

## UI behaviour

- Public, responsive page at `/landing`; no authentication needed.
- `LandingMotion.tsx` creates Lenis smooth-wheel/anchor scrolling (disabled by `prefers-reduced-motion`) and adds scroll-reactive nav states. Nav sits at page root with the page's highest z-index, so it stays above every hero, card and footer layer. It begins full-width/subtle and compacts after 72px into a restrained 480px × 56px liquid-glass bar. Dark sections declare `data-nav-tone="dark"`; the motion controller detects the section beneath the nav and switches brand, menu and toggle text to cream, returning them to charcoal over light sections. Sticky shell contains the glass header and expanded menu as sibling surfaces, preventing nested `backdrop-filter` roots from disabling menu blur. Both surfaces therefore sample the page independently with adaptive translucent tints and specular inset highlights. Dark expanded glass uses stronger optical diffusion and reduced backdrop brightness so oversized background headings become atmosphere while menu copy remains crisp. A small pointer bridge and close grace keep the menu open while moving from the compact bar into its links; click/tap pins it open, and Escape/link selection closes it. Menu links use the compact Manrope UI voice and gold hover accent rather than display-scale type.
- Hero uses editorial Kharcha messaging, product dashboard-inspired CSS artwork, and a charcoal primary CTA. The `Start tracking` CTA uses a small gold progress rail, an arrow token and a hover-only sparkle to suggest forward motion without leaving the premium Kharcha system. Its preview responds gently to pointer position, graph/bars animate into place, and orbiting money elements create restrained game-like depth. The floating rupee uses compositor-only `translate` motion so it does not trigger per-frame layout. Orbit dots are children of their ring, remain on-axis, and travel behind the dashboard layer rather than crossing its chart. A fully visible attached rail closes the hero with animated Spending, Saving, Investing, Bills and Goals markers, each paired with a 16px uncontained warm-gold line icon; it continues the hero canvas with only low-contrast dividers, and hover adds a subtle gold underline. All hero motion stops under `prefers-reduced-motion`.
- Sections cover money loop, product proof, a dark-feature contrast section, AI-generated fictional customer portraits, a financial-freedom final CTA and a full-width multi-column footer.
- Light/dark chapter boundaries use spatial chapter choreography instead of decorative dividers. The dark product chapter enters as a softly rounded sheet over the preceding cream section. Its exit becomes a full-viewport sticky handoff plane with an original raw-WebGL fragment shader rendering restrained charcoal/gold refraction; GSAP ScrollTrigger links shader progress and scroll velocity, holds the dark plane, then lets the cream customer-story sheet rise over it with perspective, clipping and internal parallax. The closing dark CTA repeats the expanding-sheet grammar. Reduced-motion visitors receive static layered chapters, and mobile keeps shorter, translation-only motion.
- The final CTA retains its original warm charcoal/gold palette and uses the supplied chrome-hands 3D artwork as the right-side freedom metaphor. The source JPEG remains unchanged and a deterministic alpha-cutout derivative removes only its black matte; a directional horizontal alpha falloff dissolves both source-cropped wrists into the section instead of exposing hard image boundaries. Only the image container drifts subtly, motion stops under `prefers-reduced-motion`, and mobile places the artwork below the copy without hiding the CTA.
- The dark product chapter uses generous responsive vertical space and a relaxed headline line height, then delays its card grid, preserving an editorial pause instead of a clustered transition; mobile reduces these values deliberately.
- Light/dark colour values use shared `--c-*` tokens where theme-aware; dark feature/footer surfaces are intentionally fixed charcoal to retain their editorial contrast.
- Dark feature demo cards are rotated as whole surfaces: their border, rows, labels and values share the same subtle tilt so the visual perspective remains coherent.
- Footer social row contains X followed by a recognizable Instagram outline icon; no third social placeholder is shown.
- Mobile collapses navigation and section grids without hiding primary actions.

## Design constraints

- Warm cream/charcoal system, sparse gold accents, Fraunces display voice and Manrope UI voice.
- Primary CTA stays `--c-cta`, never gold.
- Product preview is original CSS composition. No copied brand artwork or marketing copy.

## Reverse-engineered from

`src/app/landing/{page.tsx,LandingMotion.tsx,landing.module.css}`, `public/landing/{freedom.jpg,freedom-cutout.png,testimonial-{meera,aarav,riya}.png}`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`.
