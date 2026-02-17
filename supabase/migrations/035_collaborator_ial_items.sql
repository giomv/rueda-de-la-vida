-- ============================================================
-- Migration 035: Add user_id to IAL child tables
-- Allows collaborators to add their own items to shared sessions.
-- Each user can only edit/delete their own items.
-- ============================================================

-- ==========================================
-- 1. ADD user_id COLUMN (nullable first)
-- ==========================================

ALTER TABLE session_insights
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE session_actions
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE session_attachments
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==========================================
-- 2. BACKFILL from parent journal_sessions
-- ==========================================

UPDATE session_insights si
SET user_id = js.user_id
FROM journal_sessions js
WHERE si.session_id = js.id;

UPDATE session_actions sa
SET user_id = js.user_id
FROM journal_sessions js
WHERE sa.session_id = js.id;

UPDATE session_attachments sa
SET user_id = js.user_id
FROM journal_sessions js
WHERE sa.session_id = js.id;

-- ==========================================
-- 3. SET NOT NULL
-- ==========================================

ALTER TABLE session_insights
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE session_actions
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE session_attachments
  ALTER COLUMN user_id SET NOT NULL;

-- ==========================================
-- 4. INDEXES
-- ==========================================

CREATE INDEX idx_session_insights_user ON session_insights(user_id);
CREATE INDEX idx_session_actions_user ON session_actions(user_id);
CREATE INDEX idx_session_attachments_user ON session_attachments(user_id);

-- ==========================================
-- 5. REPLACE RLS POLICIES
-- ==========================================

-- SELECT: unchanged logic (owner sees all, collaborator sees is_shared=true)
-- INSERT: user_id must match auth.uid() + owner/collaborator access
-- UPDATE: user_id must match auth.uid() + owner/collaborator access (own items only)
-- DELETE: user_id must match auth.uid() + owner/collaborator access (own items only)

-- ------------------------------------------
-- session_insights
-- ------------------------------------------

-- INSERT
DROP POLICY IF EXISTS "Users can create insights" ON session_insights;
CREATE POLICY "Users can create insights"
  ON session_insights FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR (
        public.is_session_collaborator(session_id, true)
        AND is_shared = true
      )
    )
  );

-- UPDATE: only own items
DROP POLICY IF EXISTS "Users can update insights" ON session_insights;
CREATE POLICY "Users can update insights"
  ON session_insights FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );

-- DELETE: only own items
DROP POLICY IF EXISTS "Users can delete insights" ON session_insights;
CREATE POLICY "Users can delete insights"
  ON session_insights FOR DELETE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );

-- ------------------------------------------
-- session_actions
-- ------------------------------------------

DROP POLICY IF EXISTS "Users can create actions" ON session_actions;
CREATE POLICY "Users can create actions"
  ON session_actions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR (
        public.is_session_collaborator(session_id, true)
        AND is_shared = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can update actions" ON session_actions;
CREATE POLICY "Users can update actions"
  ON session_actions FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );

DROP POLICY IF EXISTS "Users can delete actions" ON session_actions;
CREATE POLICY "Users can delete actions"
  ON session_actions FOR DELETE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );

-- ------------------------------------------
-- session_attachments
-- ------------------------------------------

DROP POLICY IF EXISTS "Users can create attachments" ON session_attachments;
CREATE POLICY "Users can create attachments"
  ON session_attachments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR (
        public.is_session_collaborator(session_id, true)
        AND is_shared = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can update attachments" ON session_attachments;
CREATE POLICY "Users can update attachments"
  ON session_attachments FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );

DROP POLICY IF EXISTS "Users can delete attachments" ON session_attachments;
CREATE POLICY "Users can delete attachments"
  ON session_attachments FOR DELETE
  USING (
    user_id = auth.uid()
    AND (
      public.is_session_owner(session_id)
      OR public.is_session_collaborator(session_id, true)
    )
  );
