-- ============================================================
-- Migration 033: Per-item visibility (is_shared) + fix child RLS
-- ============================================================
-- 1. Add is_shared column to child tables (default true = backward-compatible)
-- 2. Replace all 12 child RLS policies to support shared session access
--    and filter private items for collaborators
-- 3. Add partial indexes for is_shared filtering

-- ==========================================
-- 1. ADD COLUMN
-- ==========================================

ALTER TABLE session_insights
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE session_actions
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE session_attachments
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT true;

-- ==========================================
-- 2. REPLACE CHILD RLS POLICIES
-- ==========================================

-- Helper: check if current user is an accepted member of the session's space
-- with canEdit permission. Uses SECURITY DEFINER to bypass RLS on the lookup.
CREATE OR REPLACE FUNCTION public.is_session_collaborator(
  _session_id UUID,
  _require_edit BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM journal_sessions js
    JOIN shared_space_members ssm
      ON ssm.space_id = js.shared_space_id
    WHERE js.id = _session_id
      AND js.shared_space_id IS NOT NULL
      AND ssm.user_id = auth.uid()
      AND ssm.status = 'accepted'
      AND (NOT _require_edit OR (ssm.permissions->>'canEdit')::boolean = true)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user owns the parent session
CREATE OR REPLACE FUNCTION public.is_session_owner(_session_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM journal_sessions
    WHERE id = _session_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ------------------------------------------
-- session_insights
-- ------------------------------------------

DROP POLICY IF EXISTS "Users can view own insights" ON session_insights;
CREATE POLICY "Users can view own or shared insights"
  ON session_insights FOR SELECT
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, false)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can create own insights" ON session_insights;
CREATE POLICY "Users can create insights"
  ON session_insights FOR INSERT
  WITH CHECK (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can update own insights" ON session_insights;
CREATE POLICY "Users can update insights"
  ON session_insights FOR UPDATE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can delete own insights" ON session_insights;
CREATE POLICY "Users can delete insights"
  ON session_insights FOR DELETE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

-- ------------------------------------------
-- session_actions
-- ------------------------------------------

DROP POLICY IF EXISTS "Users can view own actions" ON session_actions;
CREATE POLICY "Users can view own or shared actions"
  ON session_actions FOR SELECT
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, false)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can create own actions" ON session_actions;
CREATE POLICY "Users can create actions"
  ON session_actions FOR INSERT
  WITH CHECK (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can update own actions" ON session_actions;
CREATE POLICY "Users can update actions"
  ON session_actions FOR UPDATE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can delete own actions" ON session_actions;
CREATE POLICY "Users can delete actions"
  ON session_actions FOR DELETE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

-- ------------------------------------------
-- session_attachments
-- ------------------------------------------

DROP POLICY IF EXISTS "Users can view own attachments" ON session_attachments;
CREATE POLICY "Users can view own or shared attachments"
  ON session_attachments FOR SELECT
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, false)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can create own attachments" ON session_attachments;
CREATE POLICY "Users can create attachments"
  ON session_attachments FOR INSERT
  WITH CHECK (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can update own attachments" ON session_attachments;
CREATE POLICY "Users can update attachments"
  ON session_attachments FOR UPDATE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

DROP POLICY IF EXISTS "Users can delete own attachments" ON session_attachments;
CREATE POLICY "Users can delete attachments"
  ON session_attachments FOR DELETE
  USING (
    public.is_session_owner(session_id)
    OR (
      public.is_session_collaborator(session_id, true)
      AND is_shared = true
    )
  );

-- ==========================================
-- 3. PARTIAL INDEXES
-- ==========================================

CREATE INDEX idx_session_insights_shared
  ON session_insights(session_id)
  WHERE is_shared = true;

CREATE INDEX idx_session_actions_shared
  ON session_actions(session_id)
  WHERE is_shared = true;

CREATE INDEX idx_session_attachments_shared
  ON session_attachments(session_id)
  WHERE is_shared = true;
