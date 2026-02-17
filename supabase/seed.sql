-- =============================================================
-- SEED DATA for local development
-- Run with: supabase db reset
-- =============================================================
-- Users:
--   1. demo@test.com             (Demo User)
--   2. lucia.floressav@gmail.com (Lucía Flores)
-- Password for both: password123
-- =============================================================

-- ============================================================
-- 1. AUTH USERS
-- ============================================================

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'authenticated', 'authenticated',
  'demo@test.com',
  crypt('password123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Demo User"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'authenticated', 'authenticated',
  'lucia.floressav@gmail.com',
  crypt('password123', gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Lucía Flores"}'::jsonb,
  now(), now(), '', '', '', ''
);

INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
(
  gen_random_uuid(),
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  '{"sub":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","email":"demo@test.com"}'::jsonb,
  'email', now(), now(), now()
),
(
  gen_random_uuid(),
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  '{"sub":"b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e","email":"lucia.floressav@gmail.com"}'::jsonb,
  'email', now(), now(), now()
);

-- Profiles are auto-created by handle_new_user() trigger

-- ============================================================
-- 2. LIFE DOMAINS (user-level, used by goals/activities/journal)
-- ============================================================

-- Demo User
INSERT INTO life_domains (id, user_id, name, slug, icon, order_position) VALUES
('d1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Salud',          'salud',         'heart-pulse',  0),
('d1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Finanzas',        'finanzas',      'wallet',       1),
('d1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Carrera',         'carrera',       'briefcase',    2),
('d1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Relaciones',      'relaciones',    'users',        3),
('d1000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Crecimiento',     'crecimiento',   'sprout',       4),
('d1000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Diversión',       'diversion',     'party-popper', 5),
('d1000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Entorno Físico',  'entorno-fisico','home',         6),
('d1000000-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Pareja',          'pareja',        'heart',        7);

-- Lucía
INSERT INTO life_domains (id, user_id, name, slug, icon, order_position) VALUES
('d2000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Bienestar',           'bienestar',           'heart-pulse', 0),
('d2000000-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Finanzas',            'finanzas',            'wallet',      1),
('d2000000-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Trabajo',             'trabajo',             'briefcase',   2),
('d2000000-0000-0000-0000-000000000004', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Familia',             'familia',             'users',       3),
('d2000000-0000-0000-0000-000000000005', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Desarrollo Personal', 'desarrollo-personal', 'sprout',      4),
('d2000000-0000-0000-0000-000000000006', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Espiritualidad',      'espiritualidad',      'sparkles',    5);

-- ============================================================
-- 3. WHEELS
-- ============================================================

-- Demo User wheel
INSERT INTO wheels (id, user_id, title, mode, is_active, created_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Mi Rueda 2026', 'individual', true, now() - interval '30 days');

-- Lucía wheel
INSERT INTO wheels (id, user_id, title, mode, is_active, created_at) VALUES
('e2000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Rueda Febrero 2026', 'individual', true, now() - interval '15 days');

-- ============================================================
-- 3b. DOMAINS (per-wheel, used by scores/priorities/action_plans)
-- ============================================================

-- Demo User wheel domains
INSERT INTO domains (id, wheel_id, name, icon, order_position) VALUES
('de100000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Salud',          'heart-pulse',  0),
('de100000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'Finanzas',        'wallet',       1),
('de100000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', 'Carrera',         'briefcase',    2),
('de100000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000001', 'Relaciones',      'users',        3),
('de100000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000001', 'Crecimiento',     'sprout',       4),
('de100000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000001', 'Diversión',       'party-popper', 5),
('de100000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000001', 'Entorno Físico',  'home',         6),
('de100000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000001', 'Pareja',          'heart',        7);

-- Lucía wheel domains
INSERT INTO domains (id, wheel_id, name, icon, order_position) VALUES
('de200000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 'Bienestar',           'heart-pulse', 0),
('de200000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000001', 'Finanzas',            'wallet',      1),
('de200000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000001', 'Trabajo',             'briefcase',   2),
('de200000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000001', 'Familia',             'users',       3),
('de200000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000001', 'Desarrollo Personal', 'sprout',      4),
('de200000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000001', 'Espiritualidad',      'sparkles',    5);

-- ============================================================
-- 3c. WHEEL ↔ LIFE DOMAIN SELECTIONS
-- ============================================================

INSERT INTO wheel_domain_selections (wheel_id, domain_id, order_position) VALUES
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 0),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 1),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 2),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004', 3),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005', 4),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000006', 5),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000007', 6),
('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000008', 7);

INSERT INTO wheel_domain_selections (wheel_id, domain_id, order_position) VALUES
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 0),
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002', 1),
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000003', 2),
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000004', 3),
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000005', 4),
('e2000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000006', 5);

-- ============================================================
-- 3d. SCORES (reference old domains table)
-- ============================================================

INSERT INTO scores (wheel_id, domain_id, score, notes, scored_at) VALUES
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000001', 7, 'Hago ejercicio 3 veces por semana', now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000002', 5, 'Necesito mejorar el ahorro',         now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000003', 8, 'Me gusta mi trabajo actual',         now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000004', 6, 'Podría ver más a mis amigos',        now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000005', 4, 'No he leído mucho últimamente',      now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000006', 6, 'Viajé el mes pasado',                now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000007', 7, 'Departamento ordenado',              now() - interval '30 days'),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000008', 8, 'Buena comunicación',                 now() - interval '30 days');

INSERT INTO scores (wheel_id, domain_id, score, notes, scored_at) VALUES
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000001', 6, 'Duermo bien pero no hago deporte', now() - interval '15 days'),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000002', 7, 'Ahorro constante',                 now() - interval '15 days'),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000003', 5, 'Buscando nuevas oportunidades',    now() - interval '15 days'),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000004', 8, 'Muy cercana a mi familia',         now() - interval '15 days'),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000005', 6, 'Meditando regularmente',           now() - interval '15 days'),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000006', 9, 'Muy conectada espiritualmente',    now() - interval '15 days');

-- ============================================================
-- 3e. PRIORITIES (reference old domains table)
-- ============================================================

INSERT INTO priorities (wheel_id, domain_id, rank, is_focus) VALUES
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000005', 1, true),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000002', 2, true),
('e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000004', 3, true);

INSERT INTO priorities (wheel_id, domain_id, rank, is_focus) VALUES
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000003', 1, true),
('e2000000-0000-0000-0000-000000000001', 'de200000-0000-0000-0000-000000000001', 2, true);

-- ============================================================
-- 3f. ACTION PLANS (reference old domains table)
-- ============================================================

INSERT INTO action_plans (id, wheel_id, domain_id, goal_text, target_score, goals, actions) VALUES
('a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000005', 'Leer 2 libros al mes', 7,
 '[{"id":"aa000001","text":"Leer 2 libros al mes"},{"id":"aa000002","text":"Tomar un curso online"}]'::jsonb,
 '[{"id":"ab000001","text":"Leer 30 min antes de dormir"},{"id":"ab000002","text":"Inscribirme en curso de UX"}]'::jsonb),
('a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'de100000-0000-0000-0000-000000000002', 'Ahorrar 20% de mi ingreso', 8,
 '[{"id":"aa000003","text":"Ahorrar 20% de mi ingreso"},{"id":"aa000004","text":"Crear fondo de emergencia"}]'::jsonb,
 '[{"id":"ab000003","text":"Registrar gastos diarios"},{"id":"ab000004","text":"Revisar presupuesto semanal"}]'::jsonb);

-- ============================================================
-- 4. GOALS (reference life_domains)
-- ============================================================

INSERT INTO goals (id, user_id, domain_id, title, metric, target_date, origin, source_wheel_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd1000000-0000-0000-0000-000000000005', 'Leer 24 libros en 2026',      '24 libros', '2026-12-31', 'MANUAL', NULL),
('c1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd1000000-0000-0000-0000-000000000002', 'Fondo de emergencia 3 meses', 'S/. 9,000', '2026-06-30', 'WHEEL',  'e1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'd1000000-0000-0000-0000-000000000001', 'Correr media maratón',        '21 km',     '2026-09-15', 'MANUAL', NULL);

INSERT INTO goals (id, user_id, domain_id, title, metric, target_date, origin) VALUES
('c2000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'd2000000-0000-0000-0000-000000000003', 'Conseguir trabajo remoto',  NULL,         '2026-04-30', 'MANUAL'),
('c2000000-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'd2000000-0000-0000-0000-000000000001', 'Hacer yoga 4x por semana', '4 sesiones', '2026-03-31', 'MANUAL');

-- ============================================================
-- 5. LIFEPLAN ACTIVITIES + COMPLETIONS
-- ============================================================

INSERT INTO lifeplan_activities (id, user_id, title, domain_id, goal_id, source_type, frequency_type, frequency_value, order_position) VALUES
('f1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Leer 30 minutos',     'd1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'MANUAL', 'DAILY',  1, 0),
('f1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Registrar gastos',    'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'MANUAL', 'DAILY',  1, 1),
('f1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Correr',              'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'MANUAL', 'WEEKLY', 3, 2),
('f1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Revisar presupuesto', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'MANUAL', 'WEEKLY', 1, 3),
('f1000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Llamar a un amigo',   'd1000000-0000-0000-0000-000000000004', NULL,                                   'MANUAL', 'WEEKLY', 1, 4);

INSERT INTO activity_completions (activity_id, date, completed, completed_at, period_key) VALUES
-- Leer 30 min (DAILY → period_key = YYYY-MM-DD)
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 1,  true,  now() - interval '1 day',   TO_CHAR(CURRENT_DATE - 1,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 2,  true,  now() - interval '2 days',  TO_CHAR(CURRENT_DATE - 2,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 3,  false, NULL,                        TO_CHAR(CURRENT_DATE - 3,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 4,  true,  now() - interval '4 days',  TO_CHAR(CURRENT_DATE - 4,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 5,  true,  now() - interval '5 days',  TO_CHAR(CURRENT_DATE - 5,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 8,  true,  now() - interval '8 days',  TO_CHAR(CURRENT_DATE - 8,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 9,  true,  now() - interval '9 days',  TO_CHAR(CURRENT_DATE - 9,  'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000001', CURRENT_DATE - 10, true,  now() - interval '10 days', TO_CHAR(CURRENT_DATE - 10, 'YYYY-MM-DD')),
-- Registrar gastos (DAILY)
('f1000000-0000-0000-0000-000000000002', CURRENT_DATE - 1,  true,  now() - interval '1 day',  TO_CHAR(CURRENT_DATE - 1, 'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000002', CURRENT_DATE - 2,  true,  now() - interval '2 days', TO_CHAR(CURRENT_DATE - 2, 'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000002', CURRENT_DATE - 3,  true,  now() - interval '3 days', TO_CHAR(CURRENT_DATE - 3, 'YYYY-MM-DD')),
('f1000000-0000-0000-0000-000000000002', CURRENT_DATE - 5,  true,  now() - interval '5 days', TO_CHAR(CURRENT_DATE - 5, 'YYYY-MM-DD')),
-- Correr (WEEKLY → period_key = YYYY-Www)
('f1000000-0000-0000-0000-000000000003', CURRENT_DATE - 2,  true,  now() - interval '2 days', TO_CHAR(CURRENT_DATE - 2, 'IYYY') || '-W' || LPAD(TO_CHAR(CURRENT_DATE - 2, 'IW'), 2, '0')),
('f1000000-0000-0000-0000-000000000003', CURRENT_DATE - 9,  true,  now() - interval '9 days', TO_CHAR(CURRENT_DATE - 9, 'IYYY') || '-W' || LPAD(TO_CHAR(CURRENT_DATE - 9, 'IW'), 2, '0'));

-- Lucía activities
INSERT INTO lifeplan_activities (id, user_id, title, domain_id, goal_id, source_type, frequency_type, frequency_value, order_position) VALUES
('f2000000-0000-0000-0000-000000000001', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Yoga',              'd2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'MANUAL', 'WEEKLY', 4, 0),
('f2000000-0000-0000-0000-000000000002', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Aplicar a empleos', 'd2000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000001', 'MANUAL', 'DAILY',  1, 1),
('f2000000-0000-0000-0000-000000000003', 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Meditar 15 min',    'd2000000-0000-0000-0000-000000000006', NULL,                                   'MANUAL', 'DAILY',  1, 2);

-- ============================================================
-- 6. WEEKLY CHECK-INS
-- ============================================================

INSERT INTO weekly_checkins (user_id, week_start, what_worked, what_to_adjust, satisfaction_score, mood_emoji) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::int + 7), 'Logré leer todos los días. La rutina de correr va bien.', 'Necesito ser más constante con el registro de gastos.', 4, '😊'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int,       'Mejor semana de lectura. Corrí 3 veces.',                 'Llamar más seguido a amigos.',                          3, '🙂');

-- ============================================================
-- 7. ODYSSEY PLAN (Demo User)
-- ============================================================

INSERT INTO odysseys (id, user_id, title, mode, active_plan_number, current_step) VALUES
('ae000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Mi Plan de Vida', 'individual', 1, 'compare');

INSERT INTO odyssey_plans (id, odyssey_id, plan_number, headline, energy_score, confidence_score, resources_score, excitement_text, concern_text) VALUES
('af000000-0000-0000-0000-000000000001', 'ae000000-0000-0000-0000-000000000001', 1, 'Crecer en mi carrera tech',   8,  7, 6, 'La posibilidad de liderar equipos', 'El balance vida-trabajo'),
('af000000-0000-0000-0000-000000000002', 'ae000000-0000-0000-0000-000000000001', 2, 'Emprender mi propio negocio', 9,  5, 4, 'La libertad y creatividad',         'La incertidumbre financiera'),
('af000000-0000-0000-0000-000000000003', 'ae000000-0000-0000-0000-000000000001', 3, 'Año sabático para viajar',    10, 6, 3, 'Conocer nuevas culturas',           'Volver a empezar después');

INSERT INTO odyssey_milestones (plan_id, year, category, title, description, tag, order_position, domain_id) VALUES
('af000000-0000-0000-0000-000000000001', 1, 'career',   'Ascender a Tech Lead',    'Liderar un equipo de 5 personas', 'normal',     0, 'd1000000-0000-0000-0000-000000000003'),
('af000000-0000-0000-0000-000000000001', 1, 'personal', 'Terminar media maratón',  NULL,                               'normal',     1, 'd1000000-0000-0000-0000-000000000001'),
('af000000-0000-0000-0000-000000000001', 2, 'finance',  'Invertir en ETFs',        'Portafolio diversificado',         'normal',     0, 'd1000000-0000-0000-0000-000000000002'),
('af000000-0000-0000-0000-000000000001', 3, 'career',   'Ser Engineering Manager', NULL,                               'normal',     0, 'd1000000-0000-0000-0000-000000000003'),
('af000000-0000-0000-0000-000000000001', 5, 'personal', 'Comprar departamento',    'En Lima o cerca',                  'normal',     0, 'd1000000-0000-0000-0000-000000000007'),
('af000000-0000-0000-0000-000000000002', 1, 'career',   'Validar idea de negocio', 'Hacer entrevistas con usuarios',   'experiment', 0, 'd1000000-0000-0000-0000-000000000003'),
('af000000-0000-0000-0000-000000000002', 2, 'finance',  'Lanzar MVP',              'Producto mínimo viable',           'wild',       0, 'd1000000-0000-0000-0000-000000000002'),
('af000000-0000-0000-0000-000000000003', 1, 'personal', 'Viajar por Sudamérica',   '6 meses por el continente',        'wild',       0, 'd1000000-0000-0000-0000-000000000006');

-- ============================================================
-- 8. FINANCES (Demo User: Feb 2026)
-- ============================================================

INSERT INTO monthly_budgets (id, user_id, year, month) VALUES
('bb000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 2026, 2);

INSERT INTO budget_accounts (id, monthly_budget_id, name, category, base_budget, order_position) VALUES
('bc000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', 'Sueldo',          'INCOME',  5000.00, 0),
('bc000000-0000-0000-0000-000000000002', 'bb000000-0000-0000-0000-000000000001', 'Freelance',       'INCOME',  1000.00, 1),
('bc000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000001', 'Alquiler',        'EXPENSE', 1500.00, 0),
('bc000000-0000-0000-0000-000000000004', 'bb000000-0000-0000-0000-000000000001', 'Alimentación',    'EXPENSE',  800.00, 1),
('bc000000-0000-0000-0000-000000000005', 'bb000000-0000-0000-0000-000000000001', 'Transporte',      'EXPENSE',  300.00, 2),
('bc000000-0000-0000-0000-000000000006', 'bb000000-0000-0000-0000-000000000001', 'Entretenimiento', 'EXPENSE',  400.00, 3),
('bc000000-0000-0000-0000-000000000007', 'bb000000-0000-0000-0000-000000000001', 'Ahorro General',   'SAVINGS', 1200.00, 0),
('bc000000-0000-0000-0000-000000000008', 'bb000000-0000-0000-0000-000000000001', 'Fondo Emergencia', 'SAVINGS',  500.00, 1);

INSERT INTO expenses (user_id, amount, date, budget_account_id, note) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   45.50, '2026-02-01', 'bc000000-0000-0000-0000-000000000004', 'Supermercado'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   12.00, '2026-02-01', 'bc000000-0000-0000-0000-000000000005', 'Taxi al trabajo'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   85.00, '2026-02-03', 'bc000000-0000-0000-0000-000000000006', 'Cena con amigos'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   32.00, '2026-02-05', 'bc000000-0000-0000-0000-000000000004', 'Almuerzo y snacks'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 1500.00, '2026-02-05', 'bc000000-0000-0000-0000-000000000003', 'Alquiler febrero'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   55.00, '2026-02-08', 'bc000000-0000-0000-0000-000000000004', 'Supermercado semanal'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   25.00, '2026-02-10', 'bc000000-0000-0000-0000-000000000005', 'Gasolina'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',  120.00, '2026-02-12', 'bc000000-0000-0000-0000-000000000006', 'Concierto'),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',   60.00, '2026-02-14', 'bc000000-0000-0000-0000-000000000004', 'San Valentín cena');

-- ============================================================
-- 9. JOURNAL SESSIONS (Demo User)
-- ============================================================

INSERT INTO journal_sessions (id, user_id, type, title, date, provider_name, notes, duration_minutes, domain_id) VALUES
('ca000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'PSICOLOGIA',  'Sesión sobre ansiedad laboral', '2026-02-03', 'Dr. García',      'Hablamos sobre técnicas de respiración y límites en el trabajo. Me sentí más tranquilo después de la sesión.', 50, 'd1000000-0000-0000-0000-000000000001'),
('ca000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'INVERSIONES', 'Revisión portafolio Q1',        '2026-02-10', 'Asesor Martínez', 'Revisamos el rendimiento del portafolio. Sugerencia de diversificar más hacia renta fija.', 45, 'd1000000-0000-0000-0000-000000000002');

INSERT INTO session_insights (session_id, text, note, is_primary, order_index) VALUES
('ca000000-0000-0000-0000-000000000001', 'La ansiedad viene de no poner límites claros', 'Importante recordar esto', true,  0),
('ca000000-0000-0000-0000-000000000001', 'Respiración 4-7-8 funciona bien para mí',      NULL,                       false, 1),
('ca000000-0000-0000-0000-000000000002', 'ETFs de renta fija pueden reducir volatilidad', NULL,                       true,  0);

INSERT INTO session_actions (session_id, text, frequency_type, target_date, domain_id, order_index) VALUES
('ca000000-0000-0000-0000-000000000001', 'Practicar respiración 4-7-8 antes de reuniones',  'DAILY',  NULL,          'd1000000-0000-0000-0000-000000000001', 0),
('ca000000-0000-0000-0000-000000000001', 'Decir "no" a al menos 1 pedido extra por semana', 'WEEKLY', NULL,          'd1000000-0000-0000-0000-000000000003', 1),
('ca000000-0000-0000-0000-000000000002', 'Investigar ETFs de renta fija en BVL',            'ONCE',   '2026-02-28', 'd1000000-0000-0000-0000-000000000002', 0);

-- ============================================================
-- 10. DASHBOARD FOCUS (Demo User: Feb 2026)
-- ============================================================

INSERT INTO dashboard_focus (user_id, year, month, focus_type, domain_id, order_position) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 2026, 2, 'domain', 'd1000000-0000-0000-0000-000000000005', 0),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 2026, 2, 'domain', 'd1000000-0000-0000-0000-000000000002', 1);
