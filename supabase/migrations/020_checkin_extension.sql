-- Extend weekly_checkins table with satisfaction and mood tracking

ALTER TABLE weekly_checkins
ADD COLUMN satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
ADD COLUMN mood_emoji TEXT;
