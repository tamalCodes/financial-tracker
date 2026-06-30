export type ExpenseCategory =
  | "food"
  | "shopping"
  | "transport"
  | "health"
  | "groceries"
  | "other";

export type HoldingKind = "fd" | "mutual_fund";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  created_at: string;
  tags?: string[]; // legacy free-form labels (optional)
}

// Per-month investment FLOW entry (drives the "Invested" tile + Left-in-bank).
// The recurring/soft-delete model was removed in the mobile redesign.
export interface Investment {
  id: string;
  description: string;
  amount: number;
  month: string; // 'YYYY-MM-01'
  created_at: string;
}

export interface Credit {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}

// Bills & EMIs — separate ledger; a PAID bill counts toward monthly spend.
export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string | null;
  paid: boolean;
  month: string;
  created_at: string;
}

// Portfolio panel (manual, display-only — no money-model effect).
export interface Holding {
  id: string;
  kind: HoldingKind;
  name: string;
  current_value: number;
  rate: number | null;
  maturity_date: string | null;
  created_at: string;
}

export interface Sip {
  id: string;
  name: string;
  monthly: number;
  due_date: string | null;
  paid_total: number;
  created_at: string;
}

// Per-month figures + cumulative balance returned by GET /api/dashboard.
export interface MonthSummary {
  leftInBank: number; // cumulative across all months <= current
  earned: number; // Σ credits(month)
  spent: number; // Σ expenses(month) + Σ paid bills(month)
  invested: number; // Σ investments(month)
}
