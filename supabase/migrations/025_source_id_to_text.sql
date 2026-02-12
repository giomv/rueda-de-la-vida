-- Change source_id from UUID to TEXT to support composite deduplication keys
-- WHEEL imports use "{wheelId}_{domainId}_{actionId}" format
-- ODYSSEY imports use plain UUIDs (still valid as TEXT)

-- Drop the unique constraint and index first
ALTER TABLE lifeplan_activities DROP CONSTRAINT IF EXISTS lifeplan_activities_user_id_source_type_source_id_key;
DROP INDEX IF EXISTS idx_activities_source;

-- Change column type
ALTER TABLE lifeplan_activities ALTER COLUMN source_id TYPE TEXT USING source_id::TEXT;

-- Recreate the unique constraint and index
ALTER TABLE lifeplan_activities ADD CONSTRAINT lifeplan_activities_user_id_source_type_source_id_key UNIQUE(user_id, source_type, source_id);
CREATE INDEX idx_activities_source ON lifeplan_activities(source_type, source_id);
