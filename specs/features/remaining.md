# What's left (rollup) — 2026-06-30

Single-page status across backend + frontend. Detail lives in
[backend-complete-checklist.md](./backend-complete-checklist.md) and
[backend-wiring-checklist.md](./backend-wiring-checklist.md).

**Done:** backend 100% (D-A opening balance, RLS, signup trigger, route tests, CI,
migrations live, integration suite green against live DB). Frontend core loop wired
(hero, transactions, add-sheet, bills pay, investments read, greeting, signup opening
balance). Demo + dead legacy code torn down.

---

## 1. Email confirmation — RESOLVED ✅ (2026-06-30)
- [x] "Confirm email" turned **OFF** in the Supabase dashboard (testing phase, no emails). Signup now
      yields a session immediately; the `email rate limit exceeded` block is gone.
- [ ] **Later (real launch):** re-enable confirmation + add a "check your email" flow to `AuthForm`.

## 2. Final app-path (anon) smoke — DONE ✅ (2026-06-30)
- [x] Real anon signup path verified end to end — **9/9**: signup w/ ₹70k → trigger seeds profile →
      baseline 70000 → expense → 69500 → income → 79500 → paid bill → 78500 → persists across new
      session → RLS isolates users → RLS blocks cross-user writes. Test users cleaned up.

## 3. Deferred UI affordances — NEED DESIGN DECISIONS (you) ⏸
No DC mockup exists for these; backend routes are ready. Decide UX before I build:
- [ ] Portfolio value inline edit → `PUT /api/portfolio` (tap-to-edit, save on blur).
- [ ] Add bill ("+") + delete bill → `POST` / `DELETE /api/bills`.
- [ ] Add/edit/delete holdings + SIPs → `POST/PUT/DELETE /api/{holdings,sips}`.

## 4. Polish (§5) — me
- [ ] Accessibility: 44px min touch targets on FAB, pay pills, tabs.
- [ ] E2E smoke wired into CI (Playwright or reuse the headless script as a CI step).
- [ ] `Claude_Preview` screenshots vs handoff `specs/design-handoff/screenshots/01..06`.

## 5. Optional cleanup
- [ ] Revert `.claude/launch.json` `autoPort` if not wanted (cosmetic).
- [ ] Rotate the service-role key after testing (it lives in gitignored `.env`).
- [ ] Drop deprecated DB columns (`carry_forward`, `start_month`, `is_active`,
      `monthly_balances`) in a later migration once confirmed unused.
