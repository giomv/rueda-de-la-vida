-- Migration: Add goal assignments to odyssey plans
-- This allows users to import goals from Rueda de la Vida and assign them to specific years

-- Add selected_wheel_id to odysseys table
ALTER TABLE odysseys
  ADD COLUMN IF NOT EXISTS selected_wheel_id UUID REFERENCES wheels(id) ON DELETE SET NULL;

-- Create goal-year assignments table
CREATE TABLE IF NOT EXISTS odyssey_goal_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odyssey_id UUID REFERENCES odysseys(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES odyssey_plans(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  year_index INTEGER NOT NULL CHECK (year_index BETWEEN 1 AND 5),
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- A goal can only be assigned to one year per plan
  UNIQUE(plan_id, goal_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_goal_assignments_odyssey ON odyssey_goal_assignments(odyssey_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_plan ON odyssey_goal_assignments(plan_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_goal ON odyssey_goal_assignments(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignments_plan_year ON odyssey_goal_assignments(plan_id, year_index);

-- RLS policies (users can manage their own assignments via odyssey ownership)
ALTER TABLE odyssey_goal_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal assignments"
  ON odyssey_goal_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM odysseys
      WHERE odysseys.id = odyssey_goal_assignments.odyssey_id
      AND odysseys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own goal assignments"
  ON odyssey_goal_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM odysseys
      WHERE odysseys.id = odyssey_goal_assignments.odyssey_id
      AND odysseys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own goal assignments"
  ON odyssey_goal_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM odysseys
      WHERE odysseys.id = odyssey_goal_assignments.odyssey_id
      AND odysseys.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own goal assignments"
  ON odyssey_goal_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM odysseys
      WHERE odysseys.id = odyssey_goal_assignments.odyssey_id
      AND odysseys.user_id = auth.uid()
    )
  );
