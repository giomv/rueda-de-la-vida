-- Require domain_id for manually created activities
-- Imported activities (WHEEL, ODYSSEY) may lack domain if matching fails

-- Check constraint: MANUAL activities must have a domain_id
ALTER TABLE lifeplan_activities
  ADD CONSTRAINT chk_manual_activity_domain
  CHECK (source_type != 'MANUAL' OR domain_id IS NOT NULL);

-- Partial index to find activities without domain (for backfill UI)
CREATE INDEX idx_activities_no_domain
  ON lifeplan_activities(user_id)
  WHERE domain_id IS NULL AND is_archived = false;
