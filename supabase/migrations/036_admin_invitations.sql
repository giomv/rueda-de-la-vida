-- ============================================================
-- 036: Admin role, personal fields, invitations
-- ============================================================

-- 1. Extend profiles with role, personal data, and admin flags
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS document_type text CHECK (document_type IN ('DNI', 'PASSPORT')),
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false;

-- 2. Backfill existing users: mark terms as accepted, copy email from auth.users
UPDATE profiles
SET terms_accepted = true;

UPDATE profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id;

-- 3. Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- 4. RLS for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with invitations
CREATE POLICY "Admins can manage invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Public can select invitations (needed for unauthenticated token validation)
CREATE POLICY "Public can read invitations for token validation"
  ON invitations
  FOR SELECT
  TO anon
  USING (true);

-- 5. Admin can update any profile (for managing users)
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 6. Update handle_new_user() to also insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'display_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
