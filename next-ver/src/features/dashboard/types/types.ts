export interface MonthlyBalance {
  starting_balance: number;
  closing_balance: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  carry_forward?: boolean;
  carried_from_month?: string | null;
  tags?: string[];
}

export interface Investment {
  id: string;
  description: string;
  amount: number;
  is_active: boolean;
  carry_forward?: boolean | null;
  start_month: string;
}

export interface Credit {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  carry_forward?: boolean;
  carried_from_month?: string | null;
}
