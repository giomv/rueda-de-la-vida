-- Add year_names JSONB column to odyssey_plans for custom year labels
ALTER TABLE odyssey_plans ADD COLUMN year_names JSONB DEFAULT '{}';
