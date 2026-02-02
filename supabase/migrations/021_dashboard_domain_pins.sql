-- Dashboard Domain Pins table
-- Allows users to pin additional domains to their dashboard beyond wheel priorities

CREATE TABLE IF NOT EXISTS dashboard_domain_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_id UUID REFERENCES life_domains(id) ON DELETE CASCADE NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, domain_id)
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_dashboard_domain_pins_user_id ON dashboard_domain_pins(user_id);

-- RLS Policies
ALTER TABLE dashboard_domain_pins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pins
CREATE POLICY "Users can view their own domain pins"
  ON dashboard_domain_pins
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pins
CREATE POLICY "Users can insert their own domain pins"
  ON dashboard_domain_pins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pins
CREATE POLICY "Users can update their own domain pins"
  ON dashboard_domain_pins
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own pins
CREATE POLICY "Users can delete their own domain pins"
  ON dashboard_domain_pins
  FOR DELETE
  USING (auth.uid() = user_id);
