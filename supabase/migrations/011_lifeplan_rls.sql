-- RLS Policies for LifePlan (Mi Plan) tables

-- Enable RLS on all lifeplan tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifeplan_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_checkins ENABLE ROW LEVEL SECURITY;

-- Goals: users can CRUD their own
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Activities: users can CRUD their own
CREATE POLICY "Users can view own activities"
  ON lifeplan_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities"
  ON lifeplan_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON lifeplan_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON lifeplan_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Activity Completions: access through activity ownership
CREATE POLICY "Users can view own completions"
  ON activity_completions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lifeplan_activities
    WHERE lifeplan_activities.id = activity_completions.activity_id
    AND lifeplan_activities.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own completions"
  ON activity_completions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM lifeplan_activities
    WHERE lifeplan_activities.id = activity_completions.activity_id
    AND lifeplan_activities.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own completions"
  ON activity_completions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM lifeplan_activities
    WHERE lifeplan_activities.id = activity_completions.activity_id
    AND lifeplan_activities.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own completions"
  ON activity_completions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM lifeplan_activities
    WHERE lifeplan_activities.id = activity_completions.activity_id
    AND lifeplan_activities.user_id = auth.uid()
  ));

-- Weekly Check-ins: users can CRUD their own
CREATE POLICY "Users can view own checkins"
  ON weekly_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkins"
  ON weekly_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins"
  ON weekly_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins"
  ON weekly_checkins FOR DELETE
  USING (auth.uid() = user_id);
