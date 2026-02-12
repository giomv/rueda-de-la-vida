-- Add goals JSONB column to action_plans for multiple goals per domain
ALTER TABLE action_plans
ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]';

-- Migrate existing goal_text data into the new goals array
-- Each existing goal_text becomes a single-element array: [{"id": "<uuid>", "text": "<goal_text>"}]
UPDATE action_plans
SET goals = jsonb_build_array(
  jsonb_build_object('id', gen_random_uuid()::text, 'text', goal_text)
)
WHERE goal_text IS NOT NULL AND goal_text != '' AND (goals IS NULL OR goals = '[]'::jsonb);
