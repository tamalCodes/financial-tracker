// Presentational constants for the mobile home (fonts, categories, bill icons,
// AddSheet copy). The seed/model constants that used to live here were removed when
// the screen was wired to the real API — see specs/features/backend-wiring-checklist.md §2.1.

// Font stacks (next/font CSS vars from layout.tsx). Display = Bricolage, Body = Geist.
export const DISPLAY = "var(--font-heading), 'Bricolage Grotesque', sans-serif";
export const BODY = "var(--font-geist), 'Geist', system-ui, sans-serif";

// "Left in bank" is clamped ≥ 0 (D-B — never show a negative balance). Reused for all
// money strings so amounts render as grouped en-IN integers without a sign.
export const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN").format(Math.max(0, Math.round(n)));

// ── Categories (handoff §8) ──────────────────────────────────────────────────
export type CategoryKey =
  | "food"
  | "shopping"
  | "transport"
  | "health"
  | "groceries"
  | "other";

export interface Category {
  key: CategoryKey;
  label: string;
  rgb: string; // "r,g,b" for tints
  text: string; // deep-family text colour
}

export const CATS: Category[] = [
  { key: "food", label: "Food", rgb: "245,158,11", text: "#b45309" },
  { key: "shopping", label: "Shopping", rgb: "139,92,246", text: "#6d28d9" },
  { key: "transport", label: "Transport", rgb: "14,165,233", text: "#0369a1" },
  { key: "health", label: "Health", rgb: "16,185,129", text: "#047857" },
  { key: "groceries", label: "Groceries", rgb: "20,184,166", text: "#0f766e" },
  { key: "other", label: "Other", rgb: "100,116,139", text: "#475569" },
];

export const catOf = (key: CategoryKey): Category =>
  CATS.find((c) => c.key === key) ?? CATS[5];

// ── Bill icons (D-C) ─────────────────────────────────────────────────────────
// The bills table has no icon column. Derive an icon from the bill name keyword;
// fall back to a generic (miscellaneous) icon. 20×20 viewBox stroke paths.
export const BILL_ICON = {
  card: "M3 6h14v8H3z M3 9h14", // misc / fallback
  bolt: "M11 2 5 11h4l-1 5 6-8h-4l1-6z", // electricity
  wifi: "M3 8c4-3 10-3 14 0 M6 11c2.5-2 5.5-2 8 0 M10 14h.01", // wifi / broadband
  flame: "M10 3c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 2-3 2-5 1 1 2 1 2 2z", // gas
} as const;

export const billIconFor = (name: string): string => {
  const n = name.toLowerCase();
  if (/electr|power|bijli/.test(n)) return BILL_ICON.bolt;
  if (/wifi|broadband|internet|\bnet\b|fiber|fibre/.test(n)) return BILL_ICON.wifi;
  if (/gas|lpg|piped/.test(n)) return BILL_ICON.flame;
  return BILL_ICON.card;
};

// ── Investments panel view types (mapped from /api/{holdings,sips,portfolio}) ──
export interface Fd {
  name: string;
  sub: string; // D-D: "matures <date>" (no rate)
  amount: string;
}
export interface Fund {
  name: string;
  current: string;
}
export interface SipRow {
  name: string;
  monthly: string;
  due: string;
  paid: string;
}

// ── AddSheet mode matrix (README §6) ─────────────────────────────────────────
export type SheetMode = "expense" | "income" | "investment";

export const SHEET_TITLE: Record<SheetMode, string> = {
  expense: "Add expense",
  income: "Add income",
  investment: "Add investment",
};
export const SHEET_SAVE = SHEET_TITLE;
export const NOTE_LABEL: Record<SheetMode, string> = {
  expense: "Note",
  income: "Source",
  investment: "Fund",
};
export const NOTE_PLACEHOLDER: Record<SheetMode, string> = {
  expense: "e.g. Swiggy dinner",
  income: "e.g. June salary",
  investment: "e.g. UTI Nifty 50 SIP",
};
