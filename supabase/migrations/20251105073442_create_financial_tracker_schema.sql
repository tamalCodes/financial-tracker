/*
  # Financial Tracker Database Schema

  ## Overview
  This migration creates a complete financial tracking system with support for:
  - User authentication
  - Monthly balance tracking
  - Expense entries with details
  - Investment entries that carry forward monthly
  - Automatic balance calculations

  ## Tables Created

  ### 1. `monthly_balances`
  Tracks the starting and closing balance for each month per user.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `month` (date) - First day of the month (YYYY-MM-01)
  - `starting_balance` (decimal) - Opening balance for the month
  - `closing_balance` (decimal) - Calculated closing balance
  - `created_at` (timestamptz) - Record creation time
  - `updated_at` (timestamptz) - Last update time

  ### 2. `expenses`
  Stores all expense entries with description and amount.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `month` (date) - Month this expense belongs to
  - `description` (text) - Details about the expense
  - `amount` (decimal) - Expense amount
  - `created_at` (timestamptz) - When expense was recorded

  ### 3. `investments`
  Stores investment entries that automatically carry forward each month.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `description` (text) - Investment details
  - `amount` (decimal) - Investment amount
  - `start_month` (date) - Month when investment started
  - `is_active` (boolean) - Whether investment is still active
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Authenticated users required for all operations

  ## Indexes
  - Composite indexes on (user_id, month) for fast queries
  - Index on user_id for all tables
*/

-- Create monthly_balances table
CREATE TABLE IF NOT EXISTS monthly_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  starting_balance decimal(15, 2) NOT NULL DEFAULT 0,
  closing_balance decimal(15, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  description text NOT NULL,
  amount decimal(15, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal(15, 2) NOT NULL,
  start_month date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_balances_user_month ON monthly_balances(user_id, month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON expenses(user_id, month);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);

-- Enable Row Level Security
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_balances
CREATE POLICY "Users can view own monthly balances"
  ON monthly_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly balances"
  ON monthly_balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly balances"
  ON monthly_balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly balances"
  ON monthly_balances FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_monthly_balances_updated_at
  BEFORE UPDATE ON monthly_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();