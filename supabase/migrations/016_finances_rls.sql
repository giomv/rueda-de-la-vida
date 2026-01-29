-- RLS Policies for Finances tables

-- Enable RLS on all finances tables
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Monthly Budgets: users can CRUD their own
CREATE POLICY "Users can view own budgets"
  ON monthly_budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
  ON monthly_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON monthly_budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON monthly_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Budget Accounts: access through monthly_budget ownership
CREATE POLICY "Users can view own budget accounts"
  ON budget_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM monthly_budgets
    WHERE monthly_budgets.id = budget_accounts.monthly_budget_id
    AND monthly_budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own budget accounts"
  ON budget_accounts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM monthly_budgets
    WHERE monthly_budgets.id = budget_accounts.monthly_budget_id
    AND monthly_budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own budget accounts"
  ON budget_accounts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM monthly_budgets
    WHERE monthly_budgets.id = budget_accounts.monthly_budget_id
    AND monthly_budgets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own budget accounts"
  ON budget_accounts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM monthly_budgets
    WHERE monthly_budgets.id = budget_accounts.monthly_budget_id
    AND monthly_budgets.user_id = auth.uid()
  ));

-- Expenses: users can CRUD their own
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);
