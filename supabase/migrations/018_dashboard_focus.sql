-- Dashboard focus items table
-- Allows users to pin up to 3 domains/goals per month as focus items

CREATE TABLE dashboard_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  focus_type TEXT NOT NULL CHECK (focus_type IN ('domain', 'goal')),
  domain_id UUID REFERENCES life_domains(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure correct type references
  CHECK (
    (focus_type = 'domain' AND domain_id IS NOT NULL AND goal_id IS NULL) OR
    (focus_type = 'goal' AND goal_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_focus_user_month ON dashboard_focus(user_id, year, month);

-- Unique index to prevent duplicate focus items per user/month
CREATE UNIQUE INDEX idx_focus_unique_item ON dashboard_focus(
  user_id, year, month, focus_type,
  COALESCE(domain_id::text, ''),
  COALESCE(goal_id::text, '')
);

-- RLS policies
ALTER TABLE dashboard_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus"
  ON dashboard_focus FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus"
  ON dashboard_focus FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus"
  ON dashboard_focus FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own focus"
  ON dashboard_focus FOR DELETE USING (auth.uid() = user_id);
