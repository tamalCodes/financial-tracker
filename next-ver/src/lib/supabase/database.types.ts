// Database types for the Supabase client.
//
// BEST-EFFORT, hand-written from supabase/schema.sql (itself reverse-engineered).
// Replace with the generated file once you can run:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
//
// Shape matches @supabase/supabase-js's expected `Database` generic.

type MoneyRow = {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM-01'
  description: string;
  amount: number;
  carry_forward: boolean;
  carried_from_month: string | null;
  created_at: string;
};

type MoneyInsert = {
  id?: string;
  user_id: string;
  month: string;
  description: string;
  amount: number;
  carry_forward?: boolean;
  carried_from_month?: string | null;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      credits: {
        Row: MoneyRow;
        Insert: MoneyInsert;
        Update: Partial<MoneyInsert>;
        Relationships: [];
      };
      expenses: {
        Row: MoneyRow;
        Insert: MoneyInsert;
        Update: Partial<MoneyInsert>;
        Relationships: [];
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          start_month: string;
          description: string;
          amount: number;
          is_active: boolean;
          carry_forward: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_month: string;
          description: string;
          amount: number;
          is_active?: boolean;
          carry_forward?: boolean | null;
          created_at?: string;
        };
        Update: Partial<{
          start_month: string;
          description: string;
          amount: number;
          is_active: boolean;
          carry_forward: boolean | null;
        }>;
        Relationships: [];
      };
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
