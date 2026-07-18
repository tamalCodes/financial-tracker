# Landing page

## Problem

`/landing` is Kharcha's public marketing page. It turns the existing premium warm product identity into an approachable first impression and guides visitors to sign up or log in.

## UI behaviour

- Public, responsive page at `/landing`; no authentication needed.
- `LandingMotion.tsx` creates Lenis smooth-wheel/anchor scrolling (disabled by `prefers-reduced-motion`) and adds scroll-reactive nav states. Nav sits at page root with the page's highest z-index, so it stays above every hero, card and footer layer. It begins full-width/subtle and compacts after 72px into a restrained 480px × 56px glass bar. Dark sections declare `data-nav-tone="dark"`; the motion controller detects the section beneath the nav and switches brand, menu and toggle text to cream, returning them to charcoal over light sections. Compact state always exposes a visible menu toggle; hover opens menu temporarily, click/tap pins it open, and Escape/link selection closes it.
- Hero uses editorial Kharcha messaging, product dashboard-inspired CSS artwork, and a charcoal primary CTA.
- Sections cover money loop, product proof, a dark-feature contrast section, AI-generated fictional customer portraits, an animated money-world final CTA and a full-width multi-column footer.
- Light/dark colour values use shared `--c-*` tokens where theme-aware; dark feature/footer surfaces are intentionally fixed charcoal to retain their editorial contrast.
- Mobile collapses navigation and section grids without hiding primary actions.

## Design constraints

- Warm cream/charcoal system, sparse gold accents, Fraunces display voice and Manrope UI voice.
- Primary CTA stays `--c-cta`, never gold.
- Product preview is original CSS composition. No copied brand artwork or marketing copy.

## Reverse-engineered from

`src/app/landing/{page.tsx,LandingMotion.tsx,landing.module.css}`, `public/landing/testimonial-{meera,aarav,riya}.png`, `package.json`, `src/app/layout.tsx`, `src/app/globals.css`.
