# DESIGN_SYSTEM — next-ver

The shared visual language for the app's UI. Before styling a new screen or dialog,
**reuse the primitives in `src/features/shared/ui/`** rather than hand-rolling Tailwind.
This file is the source of truth for tokens and component APIs.

> Context: the four transaction modals (expense/credit/investment/starting-balance) had each
> drifted into its own look (different heading sizes, `gap-10` vs `gap-5`, raw checkbox vs
> toggle, missing max-width). They were unified onto the primitives below. Keep them unified.

## Tokens

| Category | Value | Notes |
|----------|-------|-------|
| Accent | `indigo-500` / `indigo-600` | Brand accent: toggles, focus ring, active chips. |
| Neutral | `slate-*` | Surfaces & text. |
| Text — primary | `slate-900` | Headings, input values. |
| Text — body | `slate-600/700` | Labels, secondary buttons. |
| Text — muted | `slate-500` | Subtitles. **Not** `slate-400` (contrast). |
| Text — placeholder | `slate-400` | Placeholders, hints only. |
| Field surface | `bg-slate-50` + `border-slate-200` | Idle input. |
| Field focus | `border-indigo-400` + `ring-4 ring-indigo-500/10` + `bg-white` | All inputs. |
| Radius — control | `rounded-xl` | Inputs, buttons, chips containers. |
| Radius — surface | `rounded-3xl` (sheet/card) | Modal shell. |
| Field gap | `gap-5` (20px) | Vertical rhythm between form fields. |
| Section padding | `px-6` (24px) | Modal body horizontal. |
| Heading | `text-2xl font-semibold` Bricolage Grotesque | Modal title. |
| Label | `text-sm font-medium text-slate-600` | Field label. |

Fonts: Bricolage Grotesque (headings + form controls, forced in `globals.css`), with the
Next/Geist fallback. Currency/locale is `en-IN` (₹).

## Primitives (`src/features/shared/ui/`)

### `Modal` — `Modal.tsx`
The one dialog shell. **Every modal uses it; do not re-implement a backdrop.**
- Mobile: full-bleed bottom sheet, `rounded-t-3xl`, `pb-[max(1.5rem,env(safe-area-inset-bottom))]`
  so actions clear the iOS home bar.
- Desktop (`sm+`): centered card, `max-w-md`, `rounded-3xl`.
- `z-[100]` (above app chrome — fixes the avatar/header bleeding over older `z-50` modals).
- Closes on **backdrop click** and **Escape**. Body scrolls (`max-h-[92dvh]`).
- Props: `title`, `subtitle?`, `onClose`, `closeLabel?`, `children`.
- Scroll-lock stays the caller's job (`useLockBodyScroll` in `Dashboard.tsx`).

### `Field` + `TextField` — `Field.tsx`
- `Field` = label (+ optional grey `hint`, e.g. `(optional)`) wrapping a control.
- `TextField` = the standard text input (forwardRef). Use for all plain text inputs.

### `Button` + `ButtonRow` — `Button.tsx`
- `variant="primary"` (`bg-slate-900`, confirm) | `variant="secondary"` (outline, cancel).
- `ButtonRow` lays out the Cancel/Confirm pair (`flex gap-3`, each `flex-1`).

### `ToggleCard` — `ToggleCard.tsx`
Tappable card (icon + title + description + switch) for boolean options like carry-forward.
Replaces the bare `<input type=checkbox>`. Props: `icon` (Lucide), `title`, `description`,
`checked`, `onChange`.

### `AmountInput` — `features/dashboard/components/AmountInput.tsx`
₹-prefixed amount field that accepts arithmetic (`900+300`) and totals **on blur, instantly**.
A quiet hint advertises the feature. (See D8 — the earlier fake "thinking" delay was removed.)

## Form recipe

```tsx
<Modal title="Add expense" subtitle="Record what you spent this month." onClose={onClose}>
  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
    <Field id="amount" label="Amount"><AmountInput .../></Field>
    <Field id="description" label="Title"><TextField .../></Field>
    <ToggleCard icon={Repeat} title="Repeat every month" .../>
    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    <ButtonRow>
      <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
      <Button type="submit" disabled={loading}>Add expense</Button>
    </ButtonRow>
  </form>
</Modal>
```

All four modals (`ExpenseForm`, `CreditForm`, `InvestmentForm`, `StartingBalanceModal`) follow
this exact shape. Adding a new modal? Copy it.
