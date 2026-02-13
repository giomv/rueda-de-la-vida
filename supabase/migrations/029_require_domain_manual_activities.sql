-- Require domain_id for manually created activities
-- Imported activities (WHEEL, ODYSSEY) may lack domain if matching fails

-- 1. Create an "Otros" domain for each user who has MANUAL activities without domain
INSERT INTO life_domains (user_id, name, slug, icon, order_position)
SELECT DISTINCT a.user_id, 'Otros', 'otros', 'circle-ellipsis', 99
FROM lifeplan_activities a
WHERE a.source_type = 'MANUAL' AND a.domain_id IS NULL
ON CONFLICT (user_id, slug) DO NOTHING;

-- 2. Assign orphan MANUAL activities to the user's "Otros" domain
UPDATE lifeplan_activities a
  SET domain_id = d.id
FROM life_domains d
WHERE d.user_id = a.user_id
  AND d.slug = 'otros'
  AND a.source_type = 'MANUAL'
  AND a.domain_id IS NULL;

-- 3. Check constraint: MANUAL activities must have a domain_id
ALTER TABLE lifeplan_activities
  ADD CONSTRAINT chk_manual_activity_domain
  CHECK (source_type != 'MANUAL' OR domain_id IS NOT NULL);

-- Partial index to find activities without domain (for backfill UI)
CREATE INDEX idx_activities_no_domain
  ON lifeplan_activities(user_id)
  WHERE domain_id IS NULL AND is_archived = false;
