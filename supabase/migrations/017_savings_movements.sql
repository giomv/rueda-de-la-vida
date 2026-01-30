-- Savings movements table for tracking actual savings transactions
-- Separate from budget_accounts which track planned savings

CREATE TABLE savings_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  budget_account_id UUID REFERENCES budget_accounts(id) ON DELETE SET NULL,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  note TEXT,
  movement_type TEXT NOT NULL DEFAULT 'deposit' CHECK (movement_type IN ('deposit', 'withdrawal')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_savings_user_date ON savings_movements(user_id, date);
CREATE INDEX idx_savings_domain ON savings_movements(domain_id);
CREATE INDEX idx_savings_goal ON savings_movements(goal_id);
CREATE INDEX idx_savings_account ON savings_movements(budget_account_id);

-- Auto-update updated_at trigger
CREATE TRIGGER trigger_savings_movements_updated_at
  BEFORE UPDATE ON savings_movements
  FOR EACH ROW EXECUTE FUNCTION update_finances_updated_at();

-- RLS policies
ALTER TABLE savings_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings"
  ON savings_movements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings"
  ON savings_movements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings"
  ON savings_movements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings"
  ON savings_movements FOR DELETE USING (auth.uid() = user_id);
