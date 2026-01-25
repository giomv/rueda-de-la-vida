-- Restructure odyssey_questions to odyssey_feedback
-- Add person_name column and rename question_text to feedback_text

ALTER TABLE odyssey_questions ADD COLUMN person_name TEXT NOT NULL DEFAULT '';
ALTER TABLE odyssey_questions RENAME COLUMN question_text TO feedback_text;
ALTER TABLE odyssey_questions RENAME TO odyssey_feedback;

-- Rename the index as well
ALTER INDEX idx_odyssey_questions_plan_id RENAME TO idx_odyssey_feedback_plan_id;
