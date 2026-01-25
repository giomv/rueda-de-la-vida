-- RLS policies for life_domains and wheel_domain_selections

ALTER TABLE life_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_domain_selections ENABLE ROW LEVEL SECURITY;

-- life_domains: User owns their domains
CREATE POLICY "Users can view own domains" ON life_domains
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own domains" ON life_domains
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own domains" ON life_domains
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own domains" ON life_domains
  FOR DELETE USING (user_id = auth.uid());

-- wheel_domain_selections: Access through wheel ownership
CREATE POLICY "Users can view own wheel domain selections" ON wheel_domain_selections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wheels
      WHERE wheels.id = wheel_domain_selections.wheel_id
      AND wheels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own wheel domain selections" ON wheel_domain_selections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wheels
      WHERE wheels.id = wheel_domain_selections.wheel_id
      AND wheels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own wheel domain selections" ON wheel_domain_selections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wheels
      WHERE wheels.id = wheel_domain_selections.wheel_id
      AND wheels.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own wheel domain selections" ON wheel_domain_selections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wheels
      WHERE wheels.id = wheel_domain_selections.wheel_id
      AND wheels.user_id = auth.uid()
    )
  );
