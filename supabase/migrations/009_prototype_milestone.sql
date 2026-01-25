-- Add target milestone reference to prototypes
-- This allows users to select which milestone they want to prototype

ALTER TABLE odyssey_prototypes
  ADD COLUMN target_milestone_id UUID REFERENCES odyssey_milestones(id) ON DELETE SET NULL;

-- Index for the new column
CREATE INDEX idx_odyssey_prototypes_target_milestone_id ON odyssey_prototypes(target_milestone_id);
