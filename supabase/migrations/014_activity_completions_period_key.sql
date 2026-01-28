-- Add period_key to activity_completions for period-based completion tracking
-- period_key format varies by frequency:
--   DAILY: YYYY-MM-DD (same as date)
--   WEEKLY: YYYY-Www (ISO week format)
--   MONTHLY: YYYY-MM
--   ONCE: 'ONCE'

-- Add period_key column if it doesn't exist
ALTER TABLE activity_completions
ADD COLUMN IF NOT EXISTS period_key TEXT;

-- Create function to calculate period_key from frequency_type and date
CREATE OR REPLACE FUNCTION calculate_period_key(
  freq_type TEXT,
  completion_date DATE
) RETURNS TEXT AS $$
BEGIN
  CASE freq_type
    WHEN 'DAILY' THEN
      RETURN TO_CHAR(completion_date, 'YYYY-MM-DD');
    WHEN 'WEEKLY' THEN
      -- ISO week format: YYYY-Www
      RETURN TO_CHAR(completion_date, 'IYYY') || '-W' || LPAD(TO_CHAR(completion_date, 'IW'), 2, '0');
    WHEN 'MONTHLY' THEN
      RETURN TO_CHAR(completion_date, 'YYYY-MM');
    WHEN 'ONCE' THEN
      RETURN 'ONCE';
    ELSE
      RETURN TO_CHAR(completion_date, 'YYYY-MM-DD');
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Migrate existing completions to have period_key based on their activity's frequency
UPDATE activity_completions ac
SET period_key = calculate_period_key(
  (SELECT frequency_type FROM lifeplan_activities WHERE id = ac.activity_id),
  ac.date
)
WHERE period_key IS NULL;

-- Remove duplicates: keep only the most recent completion for each (activity_id, period_key)
-- This handles cases like multiple ONCE completions that all map to 'ONCE' period_key
DELETE FROM activity_completions a
USING activity_completions b
WHERE a.activity_id = b.activity_id
  AND a.period_key = b.period_key
  AND a.id < b.id;

-- Make period_key NOT NULL after migration
ALTER TABLE activity_completions
ALTER COLUMN period_key SET NOT NULL;

-- Drop old unique constraint if it exists
ALTER TABLE activity_completions
DROP CONSTRAINT IF EXISTS activity_completions_activity_id_date_key;

-- Add new unique constraint on (activity_id, period_key)
-- This ensures only one completion per activity per period
ALTER TABLE activity_completions
ADD CONSTRAINT activity_completions_activity_id_period_key_key
UNIQUE (activity_id, period_key);

-- Add index for period_key queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_completions_period_key ON activity_completions(period_key);

-- Keep date column for historical purposes, but it's now secondary to period_key
