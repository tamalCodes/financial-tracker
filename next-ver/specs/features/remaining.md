# What's left (rollup) — 2026-06-30

Single-page status across backend + frontend. Detail lives in
[backend-complete-checklist.md](./backend-complete-checklist.md) and
[backend-wiring-checklist.md](./backend-wiring-checklist.md).

**Done:** backend 100% (D-A opening balance, RLS, signup trigger, route tests, CI,
migrations live, integration suite green against live DB). Frontend core loop wired
(hero, transactions, add-sheet, bills pay, investments read, greeting, signup opening
balance). Demo + dead legacy code torn down.

---

## 1. Email confirmation — PARKED ✅ (revisit later)
- [x] Decision: not needed now. Parked. Backend correctness does NOT depend on it — the live
      integration suite already verifies signup-trigger → opening balance → money model → RLS end to end
      (via the service-role admin path, 3/3 green).
- [ ] **Later:** prod still has "Confirm email" ON, so the real anon signup→`/dashboard` redirect won't
      have a session until confirmed. When picked up: either disable it in the dashboard, or add a
      "check your email" flow to `AuthForm`. Not blocking current work.

## 2. Final app-path (anon) smoke — PARKED with #1 ✅
- [x] Backend end-to-end already proven by the live integration suite. The anon UI-path smoke is parked
      together with email confirmation (can't get an anon session until #1 is resolved).

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
