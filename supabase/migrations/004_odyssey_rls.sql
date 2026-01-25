-- RLS Policies for Plan de Vida (Odyssey) tables

-- Enable RLS on all odyssey tables
ALTER TABLE odysseys ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_prototypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_prototype_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE odyssey_weekly_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_odysseys ENABLE ROW LEVEL SECURITY;

-- Odysseys: users can CRUD their own
CREATE POLICY "Users can view own odysseys"
  ON odysseys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own odysseys"
  ON odysseys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own odysseys"
  ON odysseys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own odysseys"
  ON odysseys FOR DELETE
  USING (auth.uid() = user_id);

-- Odyssey Plans: access through odyssey ownership
CREATE POLICY "Users can view own odyssey plans"
  ON odyssey_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_plans.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own odyssey plans"
  ON odyssey_plans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_plans.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own odyssey plans"
  ON odyssey_plans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_plans.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own odyssey plans"
  ON odyssey_plans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_plans.odyssey_id AND odysseys.user_id = auth.uid()
  ));

-- Odyssey Milestones: access through plan -> odyssey ownership
CREATE POLICY "Users can view own milestones"
  ON odyssey_milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_milestones.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own milestones"
  ON odyssey_milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_milestones.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own milestones"
  ON odyssey_milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_milestones.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own milestones"
  ON odyssey_milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_milestones.plan_id AND odysseys.user_id = auth.uid()
  ));

-- Odyssey Questions: access through plan -> odyssey ownership
CREATE POLICY "Users can view own questions"
  ON odyssey_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_questions.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own questions"
  ON odyssey_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_questions.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own questions"
  ON odyssey_questions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_questions.plan_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own questions"
  ON odyssey_questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odyssey_plans
    JOIN odysseys ON odysseys.id = odyssey_plans.odyssey_id
    WHERE odyssey_plans.id = odyssey_questions.plan_id AND odysseys.user_id = auth.uid()
  ));

-- Odyssey Prototypes: access through odyssey ownership
CREATE POLICY "Users can view own prototypes"
  ON odyssey_prototypes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_prototypes.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own prototypes"
  ON odyssey_prototypes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_prototypes.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own prototypes"
  ON odyssey_prototypes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_prototypes.odyssey_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own prototypes"
  ON odyssey_prototypes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odysseys WHERE odysseys.id = odyssey_prototypes.odyssey_id AND odysseys.user_id = auth.uid()
  ));

-- Prototype Steps: access through prototype -> odyssey ownership
CREATE POLICY "Users can view own prototype steps"
  ON odyssey_prototype_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_steps.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own prototype steps"
  ON odyssey_prototype_steps FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_steps.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own prototype steps"
  ON odyssey_prototype_steps FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_steps.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own prototype steps"
  ON odyssey_prototype_steps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_prototype_steps.prototype_id AND odysseys.user_id = auth.uid()
  ));

-- Weekly Checks: access through prototype -> odyssey ownership
CREATE POLICY "Users can view own weekly checks"
  ON odyssey_weekly_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_weekly_checks.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own weekly checks"
  ON odyssey_weekly_checks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_weekly_checks.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own weekly checks"
  ON odyssey_weekly_checks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_weekly_checks.prototype_id AND odysseys.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own weekly checks"
  ON odyssey_weekly_checks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM odyssey_prototypes
    JOIN odysseys ON odysseys.id = odyssey_prototypes.odyssey_id
    WHERE odyssey_prototypes.id = odyssey_weekly_checks.prototype_id AND odysseys.user_id = auth.uid()
  ));

-- Shared Odysseys: access through active partnerships
CREATE POLICY "Users can view shared odysseys in their partnerships"
  ON shared_odysseys FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM partnerships
    WHERE partnerships.id = shared_odysseys.partnership_id
    AND partnerships.status = 'active'
    AND (partnerships.user_a_id = auth.uid() OR partnerships.user_b_id = auth.uid())
  ));

CREATE POLICY "Users can share own odysseys"
  ON shared_odysseys FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by
    AND EXISTS (
      SELECT 1 FROM odysseys WHERE odysseys.id = shared_odysseys.odyssey_id AND odysseys.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM partnerships
      WHERE partnerships.id = shared_odysseys.partnership_id
      AND partnerships.status = 'active'
      AND (partnerships.user_a_id = auth.uid() OR partnerships.user_b_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete own shared odysseys"
  ON shared_odysseys FOR DELETE
  USING (auth.uid() = shared_by);
