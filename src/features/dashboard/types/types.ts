type ExpenseCategory =
  | "food"
  | "shopping"
  | "transport"
  | "health"
  | "groceries"
  | "other";

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  created_at: string;
  tags?: string[]; // legacy free-form labels (optional)
  tag?: string | null; // single free-form tag (mobile edit modal)
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
// EMI installments carry the emi_* fields; one-off bills leave them null.
export interface Bill {
  id: string;
  name: string;
  amount: number;
  due_date: string | null;
  paid: boolean;
  month: string;
  created_at: string;
  emi_id?: string | null; // groups installments of one EMI
  emi_seq?: number | null; // 1-based installment index
  emi_months?: number | null; // total installments (duration)
  emi_total?: number | null; // total loan amount (display only)
}

// One EMI's progress rolled up across every month (GET /api/emis).
export interface EmiProgress {
  emi_id: string;
  name: string;
  monthly: number; // per-installment amount
  total: number; // total loan amount (display only)
  months: number; // total installments
  startMonth: string; // month key (YYYY-MM-01) of the first installment (emi_seq 1)
  paidCount: number; // installments paid so far
  paidAmount: number; // Σ paid installments
  remainingCount: number; // installments still due
  remainingAmount: number; // Σ unpaid installments
}

// Per-month figures + cumulative balance returned by GET /api/dashboard.
export interface MonthSummary {
  leftInBank: number; // cumulative across all months <= current
  earned: number; // Σ credits(month)
  spent: number; // Σ expenses(month) + Σ paid bills(month)
  invested: number; // Σ investments(month)
}
