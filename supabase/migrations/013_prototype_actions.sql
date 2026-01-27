-- Prototype actions: specific actions users define for their milestones
CREATE TABLE odyssey_prototype_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prototype_id UUID REFERENCES odyssey_prototypes(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES odyssey_milestones(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_odyssey_prototype_actions_prototype_id ON odyssey_prototype_actions(prototype_id);
CREATE INDEX idx_odyssey_prototype_actions_milestone_id ON odyssey_prototype_actions(milestone_id);

-- RLS
ALTER TABLE odyssey_prototype_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prototype actions"
  ON odyssey_prototype_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_actions.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own prototype actions"
  ON odyssey_prototype_actions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_actions.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own prototype actions"
  ON odyssey_prototype_actions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_actions.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own prototype actions"
  ON odyssey_prototype_actions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_actions.prototype_id AND odysseys.user_id = auth.uid()
  ));
