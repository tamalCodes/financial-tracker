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

// Compact INR for chips/badges: 28134 → "28.1k", 1500000 → "15L". Lakh past 1,00,000
// (en-IN grouping). Trailing ".0" trimmed so round figures read clean (28000 → "28k").
export const fmtCompact = (n: number) => {
  const v = Math.max(0, Math.round(n));
  if (v < 1000) return String(v);
  if (v < 100000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(v / 100000).toFixed(1).replace(/\.0$/, "")}L`;
};

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
  { key: "food", label: "Food", rgb: "245,158,11", text: "var(--c-amber)" },
  { key: "shopping", label: "Shopping", rgb: "139,92,246", text: "var(--c-violet)" },
  { key: "other", label: "Other", rgb: "100,116,139", text: "var(--c-body)" },
];

export const catOf = (key: CategoryKey): Category =>
  CATS.find((c) => c.key === key) ?? CATS[CATS.length - 1];

// ── Bill icons (D-C) ─────────────────────────────────────────────────────────
// The bills table has no icon column. Derive an icon from the bill name keyword;
// fall back to a generic (miscellaneous) icon. 20×20 viewBox stroke paths.
const BILL_ICON = {
  card: "M3 6h14v8H3z M3 9h14", // misc / fallback
  bolt: "M11 2 5 11h4l-1 5 6-8h-4l1-6z", // electricity
  wifi: "M3 8c4-3 10-3 14 0 M6 11c2.5-2 5.5-2 8 0 M10 14h.01", // wifi / broadband
  flame: "M10 3c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 2-3 2-5 1 1 2 1 2 2z", // gas
  phone: "M6 3h8v14H6z M9 14h2", // recharge / mobile
  home: "M3 9l7-6 7 6 M5 8v9h10V8", // rent / housing
  fork: "M6 3v6a2 2 0 0 0 4 0V3 M8 9v8 M14 3v14 M14 3c-2 1-2 5 0 6", // food
  users: "M7 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M2 17c0-3 2.5-5 5-5s5 2 5 5 M14 12c2 0 4 2 4 5", // family
  shield: "M10 2l6 3v5c0 4-3 6-6 8-3-2-6-4-6-8V5l6-3z", // insurance
  cross: "M10 4v12 M4 10h12", // medical / emergency / health
  spark: "M10 2l1.6 4.4L16 8l-4.4 1.6L10 14l-1.6-4.4L4 8l4.4-1.6z M15 13l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z", // AI subscriptions
} as const;

export const billIconFor = (name: string): string => {
  const n = name.toLowerCase();
  if (/electr|power|bijli/.test(n)) return BILL_ICON.bolt;
  if (/wifi|broadband|internet|\bnet\b|fiber|fibre/.test(n)) return BILL_ICON.wifi;
  if (/gas|lpg|piped/.test(n)) return BILL_ICON.flame;
  if (/recharge|mobile|phone|prepaid|postpaid|\bsim\b|airtel|jio/.test(n)) return BILL_ICON.phone;
  if (/rent|house|housing|maintenance|society/.test(n)) return BILL_ICON.home;
  if (/food|grocer|mess|tiffin|meal|dining|swiggy|zomato/.test(n)) return BILL_ICON.fork;
  if (/family|kids|school|tuition/.test(n)) return BILL_ICON.users;
  if (/insur|premium|policy|lic\b/.test(n)) return BILL_ICON.shield;
  if (/medical|emergency|hospital|health|pharma|doctor|medicine/.test(n)) return BILL_ICON.cross;
  if (/\bai\b|chatgpt|openai|claude|gemini|copilot|midjourney|perplexity|llm|gpt/.test(n)) return BILL_ICON.spark;
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
  id: string;
  name: string;
  monthly: string;
  rawMonthly: number;
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
