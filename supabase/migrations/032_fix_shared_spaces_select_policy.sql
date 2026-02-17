-- ============================================================
-- Migration 032: Fix shared_spaces SELECT policy for pending invites
-- ============================================================
-- Problem: Invited users with status='pending' could not see the
-- space name in listPendingInvitations() because the shared_spaces
-- SELECT policy only allowed owners and accepted members.
-- Fix: Allow users with a pending invitation (matched by email) to
-- view the space so the invitation UI can display the space name.

DROP POLICY "Users can view own or member spaces" ON shared_spaces;

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
    OR EXISTS (
      SELECT 1 FROM shared_space_members
      WHERE space_id = shared_spaces.id
        AND invited_email = (auth.jwt()->>'email')
        AND status = 'pending'
    )
  );
