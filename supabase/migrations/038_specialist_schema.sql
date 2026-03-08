-- ============================================================
-- 038: Specialist portal schema
-- ============================================================

-- 1a. Extend profiles.role to include 'specialist'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'specialist'));

-- 1b. Table: specialist_user_relations
CREATE TABLE IF NOT EXISTS specialist_user_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'revoked')),
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialist_relations_specialist
  ON specialist_user_relations(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_relations_user
  ON specialist_user_relations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_specialist_relations_email_status
  ON specialist_user_relations(invited_email, status);

-- Prevent duplicate active/pending relations
CREATE UNIQUE INDEX IF NOT EXISTS idx_specialist_relations_unique_active
  ON specialist_user_relations(specialist_id, invited_email)
  WHERE status IN ('invited', 'active');

-- 1c. Table: specialist_session_notes
CREATE TABLE IF NOT EXISTS specialist_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relation_id UUID NOT NULL REFERENCES specialist_user_relations(id) ON DELETE RESTRICT,
  session_type TEXT CHECK (char_length(session_type) <= 60),
  session_date DATE NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR (duration_minutes >= 1 AND duration_minutes <= 480)),
  private_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  private_followup TEXT,
  shared_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  shared_published_at TIMESTAMPTZ,
  visibility_to_user TEXT NOT NULL DEFAULT 'none' CHECK (visibility_to_user IN ('none', 'recommendations_only')),
  lock_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialist_notes_specialist
  ON specialist_session_notes(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_notes_user
  ON specialist_session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_specialist_notes_specialist_user
  ON specialist_session_notes(specialist_id, user_id);
CREATE INDEX IF NOT EXISTS idx_specialist_notes_specialist_date
  ON specialist_session_notes(specialist_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_specialist_notes_user_published
  ON specialist_session_notes(user_id, shared_published_at)
  WHERE shared_published_at IS NOT NULL;

-- 1d. Table: specialist_bitacora_entries
CREATE TABLE IF NOT EXISTS specialist_bitacora_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_session_note_id UUID NOT NULL UNIQUE REFERENCES specialist_session_notes(id) ON DELETE CASCADE,
  title TEXT,
  date DATE NOT NULL,
  shared_recommendations_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_specialist_bitacora_user_date
  ON specialist_bitacora_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_specialist_bitacora_specialist
  ON specialist_bitacora_entries(specialist_id);
CREATE INDEX IF NOT EXISTS idx_specialist_bitacora_note
  ON specialist_bitacora_entries(specialist_session_note_id);

-- 1e. Extend lifeplan_activities source_type to include 'SPECIALIST'
ALTER TABLE lifeplan_activities
  DROP CONSTRAINT IF EXISTS lifeplan_activities_source_type_check;

ALTER TABLE lifeplan_activities
  ADD CONSTRAINT lifeplan_activities_source_type_check
  CHECK (source_type IN ('WHEEL', 'ODYSSEY', 'MANUAL', 'JOURNAL', 'SPECIALIST'));

-- 1f. Helper SQL functions
CREATE OR REPLACE FUNCTION public.is_specialist(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = _user_id AND role = 'specialist'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_active_specialist_relation(_specialist_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM specialist_user_relations
    WHERE specialist_id = _specialist_id
      AND user_id = _user_id
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1g. Add role column to invitations table
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('user', 'specialist'));

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- specialist_user_relations RLS
ALTER TABLE specialist_user_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists see own relations"
  ON specialist_user_relations
  FOR ALL
  TO authenticated
  USING (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());

CREATE POLICY "Users see relations by user_id"
  ON specialist_user_relations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users see relations by invited_email"
  ON specialist_user_relations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own relations"
  ON specialist_user_relations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- specialist_session_notes RLS
ALTER TABLE specialist_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists manage own session notes"
  ON specialist_session_notes
  FOR ALL
  TO authenticated
  USING (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());

CREATE POLICY "Users see published notes with active relation"
  ON specialist_session_notes
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND shared_published_at IS NOT NULL
    AND has_active_specialist_relation(specialist_id, auth.uid())
  );

-- specialist_bitacora_entries RLS
ALTER TABLE specialist_bitacora_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own bitacora entries"
  ON specialist_bitacora_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Specialists manage entries they created"
  ON specialist_bitacora_entries
  FOR ALL
  TO authenticated
  USING (specialist_id = auth.uid())
  WITH CHECK (specialist_id = auth.uid());
