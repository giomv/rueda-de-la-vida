-- Plan de Vida (Odyssey Plan) schema

-- Core odyssey session
CREATE TABLE odysseys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'individual' CHECK (mode IN ('individual', 'pareja')),
  active_plan_number INTEGER CHECK (active_plan_number IN (1, 2, 3)),
  current_step TEXT DEFAULT 'plan-1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3 plans per odyssey
CREATE TABLE odyssey_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odyssey_id UUID REFERENCES odysseys(id) ON DELETE CASCADE NOT NULL,
  plan_number INTEGER NOT NULL CHECK (plan_number IN (1, 2, 3)),
  headline TEXT,
  energy_score INTEGER CHECK (energy_score BETWEEN 0 AND 10),
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 10),
  resources_score INTEGER CHECK (resources_score BETWEEN 0 AND 10),
  excitement_text TEXT,
  concern_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(odyssey_id, plan_number)
);

-- Milestones (1-3 per year, 5 years)
CREATE TABLE odyssey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES odyssey_plans(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('personal', 'career', 'health', 'finance', 'couple', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT CHECK (tag IN ('normal', 'wild', 'experiment')),
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Curious questions per plan (max 3 suggested)
CREATE TABLE odyssey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES odyssey_plans(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 30-day prototype
CREATE TABLE odyssey_prototypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odyssey_id UUID REFERENCES odysseys(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES odyssey_plans(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  reflection_learned TEXT,
  reflection_adjust TEXT,
  reflection_next_step TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(odyssey_id)
);

-- 3 prototype steps (conversation, experiment, skill)
CREATE TABLE odyssey_prototype_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID REFERENCES odyssey_prototypes(id) ON DELETE CASCADE NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('conversation', 'experiment', 'skill')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly check-ins (4 weeks)
CREATE TABLE odyssey_weekly_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID REFERENCES odyssey_prototypes(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
  conversation_done BOOLEAN DEFAULT false,
  experiment_done BOOLEAN DEFAULT false,
  skill_done BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(prototype_id, week_number)
);

-- Shared odysseys for partner mode
CREATE TABLE shared_odysseys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE NOT NULL,
  odyssey_id UUID REFERENCES odysseys(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_odysseys_user_id ON odysseys(user_id);
CREATE INDEX idx_odyssey_plans_odyssey_id ON odyssey_plans(odyssey_id);
CREATE INDEX idx_odyssey_milestones_plan_id ON odyssey_milestones(plan_id);
CREATE INDEX idx_odyssey_questions_plan_id ON odyssey_questions(plan_id);
CREATE INDEX idx_odyssey_prototypes_odyssey_id ON odyssey_prototypes(odyssey_id);
CREATE INDEX idx_odyssey_prototype_steps_prototype_id ON odyssey_prototype_steps(prototype_id);
CREATE INDEX idx_odyssey_weekly_checks_prototype_id ON odyssey_weekly_checks(prototype_id);
CREATE INDEX idx_shared_odysseys_partnership_id ON shared_odysseys(partnership_id);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_odyssey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_odysseys_updated_at
  BEFORE UPDATE ON odysseys
  FOR EACH ROW EXECUTE FUNCTION update_odyssey_updated_at();

CREATE TRIGGER trigger_odyssey_plans_updated_at
  BEFORE UPDATE ON odyssey_plans
  FOR EACH ROW EXECUTE FUNCTION update_odyssey_updated_at();
