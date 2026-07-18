# Landing page

## Problem

`/landing` is Kharcha's public marketing page. It turns the existing premium warm product identity into an approachable first impression and guides visitors to sign up or log in.

## UI behaviour

- Public, responsive page at `/landing`; no authentication needed.
- Navigation is a floating frosted bar with smooth anchor travel to product sections, including a dedicated customer-stories section, plus functional `/login` and `/signup` links.
- Hero uses editorial Kharcha messaging, product dashboard-inspired CSS artwork, and a charcoal primary CTA.
- Sections cover money loop, product proof, a dark-feature contrast section, AI-generated fictional customer portraits, an animated money-world final CTA and a full-width multi-column footer.
- Light/dark colour values use shared `--c-*` tokens where theme-aware; dark feature/footer surfaces are intentionally fixed charcoal to retain their editorial contrast.
- Mobile collapses navigation and section grids without hiding primary actions.

## Design constraints

- Warm cream/charcoal system, sparse gold accents, Fraunces display voice and Manrope UI voice.
- Primary CTA stays `--c-cta`, never gold.
- Product preview is original CSS composition. No copied brand artwork or marketing copy.

## Reverse-engineered from

`src/app/landing/page.tsx`, `src/app/landing/landing.module.css`, `public/landing/testimonial-{meera,aarav,riya}.png`, `src/app/layout.tsx`, `src/app/globals.css`.
