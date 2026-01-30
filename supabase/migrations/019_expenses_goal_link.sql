-- Add goal_id to expenses table
-- Allows linking expenses to specific goals for tracking

ALTER TABLE expenses ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- Index for filtering expenses by goal
CREATE INDEX idx_expenses_goal ON expenses(goal_id);
