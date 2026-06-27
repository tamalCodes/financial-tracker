// Database types for the Supabase client.
//
// BEST-EFFORT, hand-written from supabase/schema.sql (itself reverse-engineered).
// Replace with the generated file once you can run:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
//
// Shape matches @supabase/supabase-js's expected `Database` generic.
// Post mobile redesign (migration 001): cumulative money model — see DATA_MODEL.md.

export type ExpenseCategory =
  | "food"
  | "shopping"
  | "transport"
  | "health"
  | "groceries"
  | "other";

export type HoldingKind = "fd" | "mutual_fund";

// credits: per-month income. Legacy carry-forward columns retained but unused.
type CreditRow = {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM-01'
  description: string;
  amount: number;
  carry_forward: boolean; // DEPRECATED (unused)
  carried_from_month: string | null; // DEPRECATED (unused)
  created_at: string;
};

type CreditInsert = {
  id?: string;
  user_id: string;
  month: string;
  description: string;
  amount: number;
  carry_forward?: boolean;
  carried_from_month?: string | null;
  created_at?: string;
};

// expenses: per-month spend + category enum.
type ExpenseRow = CreditRow & {
  category: ExpenseCategory;
  tags: string[] | null; // legacy free-form labels
};

type ExpenseInsert = CreditInsert & {
  category?: ExpenseCategory;
  tags?: string[] | null;
};

export type Database = {
  public: {
    Tables: {
      credits: {
        Row: CreditRow;
        Insert: CreditInsert;
        Update: Partial<CreditInsert>;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: ExpenseInsert;
        Update: Partial<ExpenseInsert>;
        Relationships: [];
      };
      // Per-month investment FLOW (drives invested_m). Legacy recurring columns deprecated.
      investments: {
        Row: {
          id: string;
          user_id: string;
          month: string; // 'YYYY-MM-01' (canonical)
          description: string;
          amount: number;
          start_month: string | null; // DEPRECATED
          is_active: boolean; // DEPRECATED
          carry_forward: boolean | null; // DEPRECATED
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          description: string;
          amount: number;
          start_month?: string | null;
          is_active?: boolean;
          carry_forward?: boolean | null;
          created_at?: string;
        };
        Update: Partial<{
          month: string;
          description: string;
          amount: number;
        }>;
        Relationships: [];
      };
      // Bills & EMIs — separate ledger; paid bills count toward monthly spend.
      bills: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          name: string;
          amount: number;
          due_date: string | null;
          paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          name: string;
          amount: number;
          due_date?: string | null;
          paid?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          amount: number;
          due_date: string | null;
          paid: boolean;
        }>;
        Relationships: [];
      };
      // Portfolio reference (manual, display-only).
      holdings: {
        Row: {
          id: string;
          user_id: string;
          kind: HoldingKind;
          name: string;
          current_value: number;
          rate: number | null;
          maturity_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: HoldingKind;
          name: string;
          current_value?: number;
          rate?: number | null;
          maturity_date?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          kind: HoldingKind;
          name: string;
          current_value: number;
          rate: number | null;
          maturity_date: string | null;
        }>;
        Relationships: [];
      };
      sips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          monthly: number;
          due_date: string | null;
          paid_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          monthly: number;
          due_date?: string | null;
          paid_total?: number;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          monthly: number;
          due_date: string | null;
          paid_total: number;
        }>;
        Relationships: [];
      };
      portfolio_totals: {
        Row: { user_id: string; value: number };
        Insert: { user_id: string; value?: number };
        Update: Partial<{ value: number }>;
        Relationships: [];
      };
      // DEPRECATED — unused since mobile redesign. Kept for back-compat.
      monthly_balances: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          starting_balance: number;
          closing_balance: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          starting_balance: number;
          closing_balance: number;
        };
        Update: Partial<{
          starting_balance: number;
          closing_balance: number;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
