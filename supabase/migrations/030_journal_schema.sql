-- Migration 030: Bitacora (Session Journal) schema
-- Tracks professional sessions (psychology, investments, medical, etc.)
-- with insights, actions, and attachments.

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE journal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PSICOLOGIA', 'INVERSIONES', 'MEDICA', 'OTRA')),
  title TEXT,
  date DATE NOT NULL,
  provider_name TEXT,
  notes TEXT,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR (duration_minutes > 0 AND duration_minutes <= 480)),
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('DEFAULT', 'PRIVATE')) DEFAULT 'DEFAULT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE session_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES journal_sessions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  is_primary BOOLEAN DEFAULT false,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE session_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES journal_sessions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  frequency_type TEXT CHECK (frequency_type IS NULL OR frequency_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE')),
  frequency_value INTEGER DEFAULT 1,
  target_date DATE,
  domain_id UUID REFERENCES life_domains(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  lifeplan_activity_id UUID REFERENCES lifeplan_activities(id) ON DELETE SET NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE session_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES journal_sessions(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('LINK', 'FILE')),
  url TEXT,
  file_path TEXT,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_attachment_source CHECK (url IS NOT NULL OR file_path IS NOT NULL)
);

-- ============================================================
-- 2. ADD 'JOURNAL' TO source_type IN lifeplan_activities
-- ============================================================

ALTER TABLE lifeplan_activities
  DROP CONSTRAINT IF EXISTS lifeplan_activities_source_type_check;

ALTER TABLE lifeplan_activities
  ADD CONSTRAINT lifeplan_activities_source_type_check
  CHECK (source_type IN ('WHEEL', 'ODYSSEY', 'MANUAL', 'JOURNAL'));

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- Journal Sessions
CREATE INDEX idx_journal_sessions_user ON journal_sessions(user_id);
CREATE INDEX idx_journal_sessions_date ON journal_sessions(user_id, date DESC);
CREATE INDEX idx_journal_sessions_type ON journal_sessions(user_id, type);
CREATE INDEX idx_journal_sessions_domain ON journal_sessions(domain_id) WHERE domain_id IS NOT NULL;
CREATE INDEX idx_journal_sessions_goal ON journal_sessions(goal_id) WHERE goal_id IS NOT NULL;
CREATE INDEX idx_journal_sessions_visibility ON journal_sessions(user_id, visibility);

-- Full-text search (Spanish)
CREATE INDEX idx_journal_sessions_search ON journal_sessions
  USING GIN (to_tsvector('spanish',
    coalesce(title, '') || ' ' || coalesce(notes, '') || ' ' || coalesce(provider_name, '')
  ));

-- Session Insights
CREATE INDEX idx_session_insights_session ON session_insights(session_id);
CREATE INDEX idx_session_insights_domain ON session_insights(domain_id) WHERE domain_id IS NOT NULL;

-- Session Actions
CREATE INDEX idx_session_actions_session ON session_actions(session_id);
CREATE INDEX idx_session_actions_lifeplan ON session_actions(lifeplan_activity_id) WHERE lifeplan_activity_id IS NOT NULL;

-- Session Attachments
CREATE INDEX idx_session_attachments_session ON session_attachments(session_id);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_journal_sessions_updated_at
  BEFORE UPDATE ON journal_sessions
  FOR EACH ROW EXECUTE FUNCTION update_journal_updated_at();

CREATE TRIGGER trigger_session_actions_updated_at
  BEFORE UPDATE ON session_actions
  FOR EACH ROW EXECUTE FUNCTION update_journal_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE journal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attachments ENABLE ROW LEVEL SECURITY;

-- journal_sessions: users CRUD own
CREATE POLICY "Users can view own sessions"
  ON journal_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON journal_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON journal_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON journal_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- session_insights: access through session ownership
CREATE POLICY "Users can view own insights"
  ON session_insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_insights.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own insights"
  ON session_insights FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_insights.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own insights"
  ON session_insights FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_insights.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own insights"
  ON session_insights FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_insights.session_id AND user_id = auth.uid()
  ));

-- session_actions: access through session ownership
CREATE POLICY "Users can view own actions"
  ON session_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_actions.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own actions"
  ON session_actions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_actions.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own actions"
  ON session_actions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_actions.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own actions"
  ON session_actions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_actions.session_id AND user_id = auth.uid()
  ));

-- session_attachments: access through session ownership
CREATE POLICY "Users can view own attachments"
  ON session_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_attachments.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own attachments"
  ON session_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_attachments.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update own attachments"
  ON session_attachments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_attachments.session_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own attachments"
  ON session_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = session_attachments.session_id AND user_id = auth.uid()
  ));
