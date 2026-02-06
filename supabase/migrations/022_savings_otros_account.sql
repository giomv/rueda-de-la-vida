-- Migration: Add "Otros" SAVINGS account creation
-- Updates the trigger to create both EXPENSE and SAVINGS "Otros" accounts

-- Replace the trigger function to create both Otros accounts
CREATE OR REPLACE FUNCTION create_otros_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Create EXPENSE "Otros" account
  INSERT INTO budget_accounts (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
  VALUES (NEW.id, 'Otros', 'EXPENSE', 0, 999, true);

  -- Create SAVINGS "Otros" account
  INSERT INTO budget_accounts (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
  VALUES (NEW.id, 'Otros', 'SAVINGS', 0, 999, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add SAVINGS "Otros" account to existing monthly_budgets that don't have one
INSERT INTO budget_accounts (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
SELECT mb.id, 'Otros', 'SAVINGS', 0, 999, true
FROM monthly_budgets mb
WHERE NOT EXISTS (
  SELECT 1 FROM budget_accounts ba
  WHERE ba.monthly_budget_id = mb.id
  AND ba.category = 'SAVINGS'
  AND ba.is_otros_account = true
);
