// Demo data + money model for the mobile home. Pixel/behaviour source of truth:
// next-ver/specs/design-handoff/*.dc.html + README §7. NO backend — all in-memory.
// When wiring real data later, replace the seeds/derive here; components stay untouched.

// Font stacks (next/font CSS vars from layout.tsx). Display = Bricolage, Body = Geist.
export const DISPLAY = "var(--font-heading), 'Bricolage Grotesque', sans-serif";
export const BODY = "var(--font-geist), 'Geist', system-ui, sans-serif";

// ── Money model constants (README §7) ────────────────────────────────────────
export const SALARY = 184500;
export const AUTO_INVEST = 30000;
export const SPENT_BASE = 86461;

export const MONTHS = [
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
] as const;
export const DEFAULT_MONTH_IDX = 3; // June 2026

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

// ── Transactions seed (README §7, newest first) ──────────────────────────────
export interface Tx {
  merchant: string;
  cat: CategoryKey;
  amount: number;
  date: string;
}

export const SEED_TXS: Tx[] = [
  { merchant: "Swiggy Instamart", cat: "food", amount: 642, date: "Today" },
  { merchant: "Myntra", cat: "shopping", amount: 3499, date: "25 Jun" },
  { merchant: "Uber", cat: "transport", amount: 318, date: "25 Jun" },
  { merchant: "Apollo Pharmacy", cat: "health", amount: 1240, date: "24 Jun" },
  { merchant: "Zomato", cat: "food", amount: 880, date: "22 Jun" },
  { merchant: "Reliance Trends", cat: "shopping", amount: 4200, date: "21 Jun" },
];

// ── Bills seed (README §7). Icons are 20×20 viewBox stroke paths. ─────────────
export const BILL_ICON = {
  card: "M3 6h14v8H3z M3 9h14",
  bolt: "M11 2 5 11h4l-1 5 6-8h-4l1-6z",
  home: "M3 9l7-5 7 5 M5 8v8h10V8",
  car: "M3 11l2-4h10l2 4 M3 11h14v3H3z",
  wifi: "M3 8c4-3 10-3 14 0 M6 11c2.5-2 5.5-2 8 0 M10 14h.01",
  flame: "M10 3c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 2-3 2-5 1 1 2 1 2 2z",
} as const;

export interface BillDef {
  id: string;
  name: string;
  amount: number;
  due: string;
  icon: string;
  paidDefault?: boolean;
}

export const BILL_DEFS: BillDef[] = [
  { id: "cc", name: "HDFC Credit Card", amount: 14200, due: "25 Jun", icon: BILL_ICON.card },
  { id: "elec", name: "Electricity", amount: 2340, due: "28 Jun", icon: BILL_ICON.bolt },
  { id: "home", name: "Home Loan EMI", amount: 28450, due: "05 Jul", icon: BILL_ICON.home },
  { id: "car", name: "Car Loan EMI", amount: 11800, due: "07 Jul", icon: BILL_ICON.car },
  { id: "net", name: "Broadband", amount: 1199, due: "02 Jul", icon: BILL_ICON.wifi },
  { id: "gas", name: "Piped Gas", amount: 620, due: "18 Jun", icon: BILL_ICON.flame, paidDefault: true },
];

// ── Investments seed (FinanceDashboard.dc.html data) ─────────────────────────
export const PORTFOLIO_TOTAL = "6,51,500";

export interface Fd {
  name: string;
  sub: string;
  amount: string;
}
export const FDS: Fd[] = [
  { name: "SBI Fixed Deposit", sub: "7.10% p.a. · matures 14 Mar 2027", amount: "2,00,000" },
  { name: "ICICI Tax-Saver FD", sub: "6.90% p.a. · matures 02 Aug 2028", amount: "1,50,000" },
];

export interface Fund {
  name: string;
  current: string;
}
export const FUNDS: Fund[] = [
  { name: "UTI Nifty 50 Index Fund", current: "1,38,400" },
  { name: "Parag Parikh Flexi Cap", current: "84,200" },
  { name: "Quant Small Cap", current: "78,900" },
];

export interface SipRow {
  name: string;
  monthly: string;
  due: string;
  paid: string;
}
export const SIPS: SipRow[] = [
  { name: "UTI Nifty 50 Index Fund", monthly: "10,000", due: "05 Jul", paid: "1,20,000" },
  { name: "Parag Parikh Flexi Cap", monthly: "7,500", due: "10 Jul", paid: "90,000" },
  { name: "Quant Small Cap", monthly: "5,000", due: "15 Jul", paid: "60,000" },
];

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
