-- Independent domains table (user-owned, reusable across wheels and odyssey milestones)
CREATE TABLE life_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,  -- normalized: lowercase, no accents, for fuzzy matching
  icon TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Junction table: wheel uses domains
CREATE TABLE wheel_domain_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id UUID REFERENCES wheels(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES life_domains(id) ON DELETE CASCADE NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  UNIQUE(wheel_id, domain_id)
);

-- Add domain_id to milestones (replaces category)
ALTER TABLE odyssey_milestones
  ADD COLUMN domain_id UUID REFERENCES life_domains(id);

-- Make category column nullable now that we have domain_id
ALTER TABLE odyssey_milestones
  ALTER COLUMN category DROP NOT NULL;

-- Drop the category CHECK constraint and add a new one that allows NULL
ALTER TABLE odyssey_milestones
  DROP CONSTRAINT IF EXISTS odyssey_milestones_category_check;

-- Indexes
CREATE INDEX idx_life_domains_user_id ON life_domains(user_id);
CREATE INDEX idx_life_domains_slug ON life_domains(slug);
CREATE INDEX idx_wheel_domain_selections_wheel_id ON wheel_domain_selections(wheel_id);
CREATE INDEX idx_wheel_domain_selections_domain_id ON wheel_domain_selections(domain_id);
CREATE INDEX idx_odyssey_milestones_domain_id ON odyssey_milestones(domain_id);

-- Function to normalize text to slug (lowercase, no accents)
CREATE OR REPLACE FUNCTION normalize_to_slug(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    translate(
      input,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÑñÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
