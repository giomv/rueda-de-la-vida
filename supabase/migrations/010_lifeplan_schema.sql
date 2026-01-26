-- LifePlan (Mi Plan) schema
-- Centralized activity tracking integrating with Wheel of Life and Odyssey

-- Goals table (supports import from Wheel/Odyssey + manual creation)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  metric TEXT,
  target_date DATE,
  origin TEXT NOT NULL CHECK (origin IN ('WHEEL', 'ODYSSEY', 'MANUAL')) DEFAULT 'MANUAL',
  source_wheel_id UUID REFERENCES wheels(id) ON DELETE SET NULL,
  source_odyssey_id UUID REFERENCES odysseys(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LifePlan Activities table
CREATE TABLE lifeplan_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('WHEEL', 'ODYSSEY', 'MANUAL')) DEFAULT 'MANUAL',
  source_id UUID,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')) DEFAULT 'WEEKLY',
  frequency_value INTEGER DEFAULT 1,
  scheduled_days TEXT[],
  time_of_day TIME,
  order_position INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source_type, source_id)
);

-- Activity Completions
CREATE TABLE activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES lifeplan_activities(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(activity_id, date)
);

-- Weekly Check-ins
CREATE TABLE weekly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  what_worked TEXT,
  what_to_adjust TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Indexes for performance
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_domain ON goals(domain_id);
CREATE INDEX idx_goals_origin ON goals(origin);
CREATE INDEX idx_activities_user ON lifeplan_activities(user_id);
CREATE INDEX idx_activities_domain ON lifeplan_activities(domain_id);
CREATE INDEX idx_activities_goal ON lifeplan_activities(goal_id);
CREATE INDEX idx_activities_source ON lifeplan_activities(source_type, source_id);
CREATE INDEX idx_completions_activity ON activity_completions(activity_id);
CREATE INDEX idx_completions_date ON activity_completions(date);
CREATE INDEX idx_checkins_user ON weekly_checkins(user_id);
CREATE INDEX idx_checkins_week ON weekly_checkins(week_start);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_lifeplan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_lifeplan_updated_at();

CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON lifeplan_activities
  FOR EACH ROW EXECUTE FUNCTION update_lifeplan_updated_at();
