-- Add milestone_id to prototype steps to support per-milestone steps
ALTER TABLE odyssey_prototype_steps
  ADD COLUMN milestone_id UUID REFERENCES odyssey_milestones(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_odyssey_prototype_steps_milestone_id ON odyssey_prototype_steps(milestone_id);
