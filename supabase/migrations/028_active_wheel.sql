-- Add is_active column to wheels
ALTER TABLE wheels ADD COLUMN is_active boolean NOT NULL DEFAULT false;

-- Partial unique index: only one active wheel per user
CREATE UNIQUE INDEX idx_wheels_user_active
  ON wheels (user_id)
  WHERE is_active = TRUE;

-- Trigger: when a wheel is set active, deactivate all other wheels for that user
CREATE OR REPLACE FUNCTION ensure_single_active_wheel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE wheels
       SET is_active = FALSE
     WHERE user_id = NEW.user_id
       AND id != NEW.id
       AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_active_wheel
  BEFORE INSERT OR UPDATE OF is_active ON wheels
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_active_wheel();

-- Data migration: set the most recent wheel per user as active
UPDATE wheels w
   SET is_active = TRUE
  FROM (
    SELECT DISTINCT ON (user_id) id
      FROM wheels
     WHERE user_id IS NOT NULL
     ORDER BY user_id, created_at DESC
  ) latest
 WHERE w.id = latest.id;
