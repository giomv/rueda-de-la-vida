-- =============================================================
-- CREATE OR UPDATE PRODUCTION USER
-- =============================================================
-- This query creates a fully configured user in production,
-- or updates an existing one if the email already exists.
-- It handles:
--   1. Auth user creation or update (with email confirmed)
--   2. Auth identity linking (if new)
--   3. Profile update (role, personal data, flags)
--
-- USAGE: Replace the placeholder values below and run.
-- =============================================================

-- ========================
-- CONFIGURATION (edit these)
-- ========================
DO $$
DECLARE
  _email        TEXT := 'admin@designbyvia.com';          -- User email
  _password     TEXT := 'password123';            -- Initial password
  _display_name TEXT := 'Admin VIA';              -- Display name
  _first_name   TEXT := 'Admin';                  -- First name (NULL if not needed)
  _last_name    TEXT := 'VIA';                    -- Last name (NULL if not needed)
  _role         TEXT := 'admin';                  -- 'admin' or 'user'
  _force_pw     BOOLEAN := TRUE;                  -- Force password change on first login
  _user_id      UUID;
  _is_new       BOOLEAN := FALSE;
BEGIN

  -- Check if user already exists
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;

  IF _user_id IS NULL THEN
    -- 1a. Create new auth user
    _user_id := gen_random_uuid();
    _is_new := TRUE;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      _user_id,
      'authenticated', 'authenticated',
      _email,
      crypt(_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('display_name', _display_name),
      NOW(), NOW(), '', '', '', ''
    );

    -- 2. Create auth identity (required for email/password login)
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      _user_id::TEXT,
      _user_id,
      jsonb_build_object('sub', _user_id::TEXT, 'email', _email),
      'email',
      NOW(), NOW(), NOW()
    );

  ELSE
    -- 1b. Update existing auth user
    UPDATE auth.users SET
      encrypted_password = crypt(_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('display_name', _display_name),
      updated_at         = NOW()
    WHERE id = _user_id;
  END IF;

  -- 3. Update profile
  UPDATE public.profiles SET
    role                  = _role,
    first_name            = _first_name,
    last_name             = _last_name,
    force_password_change = _force_pw,
    terms_accepted        = TRUE
  WHERE id = _user_id;

  IF _is_new THEN
    RAISE NOTICE 'User CREATED: % (id: %)', _email, _user_id;
  ELSE
    RAISE NOTICE 'User UPDATED: % (id: %)', _email, _user_id;
  END IF;

END $$;
