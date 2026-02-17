-- ============================================================
-- Migration 031: Shared Spaces + Shared Journal Sessions
-- ============================================================

-- Enable moddatetime extension (for updated_at triggers)
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- ==========================================
-- 1. shared_spaces
-- ==========================================
CREATE TABLE shared_spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) <= 60),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_spaces_owner ON shared_spaces(owner_id);

-- ==========================================
-- 2. shared_space_members
-- ==========================================
CREATE TABLE shared_space_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id       UUID NOT NULL REFERENCES shared_spaces(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL until user signs up
  invited_email  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'collaborator'
                   CHECK (role IN ('owner', 'collaborator')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'accepted', 'rejected')),
  permissions    JSONB NOT NULL DEFAULT '{"canEdit": true}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one membership per space + email (prevents duplicate invites)
CREATE UNIQUE INDEX idx_ssm_space_email
  ON shared_space_members(space_id, invited_email);

-- Unique: one membership per space + user (prevents dupes after acceptance)
CREATE UNIQUE INDEX idx_ssm_space_user
  ON shared_space_members(space_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_ssm_user ON shared_space_members(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_ssm_email_status
  ON shared_space_members(invited_email, status);
CREATE INDEX idx_ssm_space_status
  ON shared_space_members(space_id, status);

-- ==========================================
-- 3. Alter journal_sessions
-- ==========================================

-- 3a. Change type from enum CHECK to free text (max 60)
ALTER TABLE journal_sessions
  DROP CONSTRAINT IF EXISTS journal_sessions_type_check;

ALTER TABLE journal_sessions
  ALTER COLUMN type TYPE TEXT;

ALTER TABLE journal_sessions
  ADD CONSTRAINT journal_sessions_type_length
  CHECK (char_length(type) <= 60);

-- Make type NOT NULL with a non-empty check
ALTER TABLE journal_sessions
  ADD CONSTRAINT journal_sessions_type_not_empty
  CHECK (type <> '');

-- 3b. Add shared space reference
ALTER TABLE journal_sessions
  ADD COLUMN shared_space_id UUID REFERENCES shared_spaces(id) ON DELETE SET NULL;

-- 3c. Add optimistic concurrency control
ALTER TABLE journal_sessions
  ADD COLUMN lock_version INTEGER NOT NULL DEFAULT 1;

-- 3d. Add last_edited_by
ALTER TABLE journal_sessions
  ADD COLUMN last_edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Indexes for shared queries
CREATE INDEX idx_js_shared_space ON journal_sessions(shared_space_id)
  WHERE shared_space_id IS NOT NULL;
CREATE INDEX idx_js_shared_space_date
  ON journal_sessions(shared_space_id, date DESC)
  WHERE shared_space_id IS NOT NULL;

-- ==========================================
-- 4. journal_session_user_states
-- ==========================================
CREATE TABLE journal_session_user_states (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES journal_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_jsus_session_user
  ON journal_session_user_states(session_id, user_id);
CREATE INDEX idx_jsus_user_archived
  ON journal_session_user_states(user_id)
  WHERE archived_at IS NOT NULL;

-- ==========================================
-- 5. Full-text search: extend to include type (now free text)
-- ==========================================
DROP INDEX IF EXISTS idx_js_search;
CREATE INDEX idx_js_search ON journal_sessions USING gin(
  to_tsvector('spanish',
    coalesce(title, '') || ' ' ||
    coalesce(provider_name, '') || ' ' ||
    coalesce(notes, '') || ' ' ||
    coalesce(type, '')
  )
);

-- ==========================================
-- 6. RLS Policies
-- ==========================================

-- shared_spaces: owner can do everything
ALTER TABLE shared_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or member spaces"
  ON shared_spaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM shared_space_members
      WHERE space_id = shared_spaces.id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
  );

CREATE POLICY "Owner can insert spaces"
  ON shared_spaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update spaces"
  ON shared_spaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can delete spaces"
  ON shared_spaces FOR DELETE
  USING (owner_id = auth.uid());

-- shared_space_members
ALTER TABLE shared_space_members ENABLE ROW LEVEL SECURITY;

-- Helper: check space ownership without triggering RLS on shared_spaces
CREATE OR REPLACE FUNCTION public.is_space_owner(_space_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM shared_spaces
    WHERE id = _space_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Space owner can manage members"
  ON shared_space_members FOR ALL
  USING (public.is_space_owner(space_id))
  WITH CHECK (public.is_space_owner(space_id));

CREATE POLICY "Members can view own membership"
  ON shared_space_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Invited users can view their pending invite"
  ON shared_space_members FOR SELECT
  USING (
    invited_email = (auth.jwt()->>'email')
  );

CREATE POLICY "Invited users can update their own invitation status"
  ON shared_space_members FOR UPDATE
  USING (
    invited_email = (auth.jwt()->>'email')
    AND status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
  );

-- journal_sessions: extend existing policies for shared access
-- Drop existing SELECT policy and replace with shared-aware version
DROP POLICY IF EXISTS "Users can view own sessions" ON journal_sessions;

CREATE POLICY "Users can view own or shared sessions"
  ON journal_sessions FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      shared_space_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM shared_space_members
        WHERE space_id = journal_sessions.shared_space_id
          AND user_id = auth.uid()
          AND status = 'accepted'
      )
    )
  );

-- Update policy: owner always, collaborator if canEdit
DROP POLICY IF EXISTS "Users can update own sessions" ON journal_sessions;

CREATE POLICY "Users can update own or shared-editable sessions"
  ON journal_sessions FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      shared_space_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM shared_space_members
        WHERE space_id = journal_sessions.shared_space_id
          AND user_id = auth.uid()
          AND status = 'accepted'
          AND (permissions->>'canEdit')::boolean = true
      )
    )
  );

-- Delete: owner only (unchanged logic, but explicit)
DROP POLICY IF EXISTS "Users can delete own sessions" ON journal_sessions;

CREATE POLICY "Users can delete own sessions"
  ON journal_sessions FOR DELETE
  USING (user_id = auth.uid());

-- INSERT: owner only (unchanged)
-- (keep existing insert policy as-is)

-- journal_session_user_states: user can manage own state
ALTER TABLE journal_session_user_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own session states"
  ON journal_session_user_states FOR ALL
  USING (user_id = auth.uid());

-- ==========================================
-- 7. Auto-insert owner as member on space creation
-- ==========================================
CREATE OR REPLACE FUNCTION auto_add_space_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shared_space_members (space_id, user_id, invited_email, role, status)
  VALUES (
    NEW.id,
    NEW.owner_id,
    (SELECT email FROM auth.users WHERE id = NEW.owner_id),
    'owner',
    'accepted'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_add_space_owner
  AFTER INSERT ON shared_spaces
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_space_owner();

-- ==========================================
-- 8. updated_at triggers
-- ==========================================
CREATE TRIGGER set_shared_spaces_updated_at
  BEFORE UPDATE ON shared_spaces
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_shared_space_members_updated_at
  BEFORE UPDATE ON shared_space_members
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER set_journal_session_user_states_updated_at
  BEFORE UPDATE ON journal_session_user_states
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- ==========================================
-- 9. Grants for PostgREST (Supabase JS client)
-- ==========================================
GRANT ALL ON shared_spaces TO authenticated;
GRANT ALL ON shared_space_members TO authenticated;
GRANT ALL ON journal_session_user_states TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
