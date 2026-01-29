-- Finances schema
-- Budget tracking with monthly budgets, accounts, and expense logging

-- Monthly budgets (one per user per month)
CREATE TABLE monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Budget accounts (lines within a budget)
CREATE TABLE budget_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_budget_id UUID REFERENCES monthly_budgets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('INCOME', 'EXPENSE', 'SAVINGS')),
  base_budget DECIMAL(12,2) DEFAULT 0,
  order_position INTEGER DEFAULT 0,
  is_otros_account BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses (daily logging)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  budget_account_id UUID REFERENCES budget_accounts(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_monthly_budgets_user ON monthly_budgets(user_id);
CREATE INDEX idx_monthly_budgets_user_year_month ON monthly_budgets(user_id, year, month);
CREATE INDEX idx_budget_accounts_budget ON budget_accounts(monthly_budget_id);
CREATE INDEX idx_budget_accounts_category ON budget_accounts(category);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_account ON expenses(budget_account_id);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);

-- Auto-update updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_finances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monthly_budgets_updated_at
  BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION update_finances_updated_at();

CREATE TRIGGER trigger_budget_accounts_updated_at
  BEFORE UPDATE ON budget_accounts
  FOR EACH ROW EXECUTE FUNCTION update_finances_updated_at();

CREATE TRIGGER trigger_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_finances_updated_at();

-- Auto-create "Otros" account when a monthly_budget is created
CREATE OR REPLACE FUNCTION create_otros_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO budget_accounts (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
  VALUES (NEW.id, 'Otros', 'EXPENSE', 0, 999, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_otros_account
  AFTER INSERT ON monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION create_otros_account();
