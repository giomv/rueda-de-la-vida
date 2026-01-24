-- Users (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  dark_mode boolean default false,
  reminders_enabled boolean default true,
  created_at timestamptz default now()
);

-- Wheels
create table if not exists wheels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  mode text check (mode in ('individual', 'pareja', 'compartida')) default 'individual',
  is_guest boolean default false,
  guest_token text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Domains
create table if not exists domains (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  name text not null,
  icon text,
  order_position integer not null,
  created_at timestamptz default now()
);

-- Scores
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  domain_id uuid references domains(id) on delete cascade,
  score integer check (score >= 0 and score <= 10),
  notes text,
  scored_at timestamptz default now()
);

-- Priorities
create table if not exists priorities (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  domain_id uuid references domains(id) on delete cascade,
  rank integer not null,
  is_focus boolean default false
);

-- Reflections
create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  question_key text not null,
  answer_text text,
  created_at timestamptz default now()
);

-- Ideal Life (Exercise 2)
create table if not exists ideal_life (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  domain_id uuid references domains(id) on delete cascade,
  vision_text text,
  prompts_answers jsonb default '{}',
  created_at timestamptz default now()
);

-- Action Plans
create table if not exists action_plans (
  id uuid primary key default gen_random_uuid(),
  wheel_id uuid references wheels(id) on delete cascade,
  domain_id uuid references domains(id) on delete cascade,
  goal_text text,
  target_score integer check (target_score >= 0 and target_score <= 10),
  actions jsonb default '[]',
  created_at timestamptz default now()
);

-- Habits (Tracking)
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  action_plan_id uuid references action_plans(id) on delete cascade,
  name text not null,
  frequency text,
  created_at timestamptz default now()
);

-- Habit Completions
create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  completed_at date not null,
  notes text
);

-- Partnerships
create table if not exists partnerships (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references profiles(id),
  user_b_id uuid references profiles(id),
  status text check (status in ('pending', 'active', 'ended')) default 'pending',
  invite_code text unique,
  privacy_level text check (privacy_level in ('full', 'scores_only', 'priorities', 'none')) default 'scores_only',
  created_at timestamptz default now()
);

-- Shared Wheels (partner mode)
create table if not exists shared_wheels (
  id uuid primary key default gen_random_uuid(),
  partnership_id uuid references partnerships(id) on delete cascade,
  wheel_id uuid references wheels(id) on delete cascade,
  shared_by uuid references profiles(id)
);

-- Guest Sessions
create table if not exists guest_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text unique not null,
  wheel_id uuid references wheels(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '30 days')
);

-- Indexes
create index if not exists idx_wheels_user_id on wheels(user_id);
create index if not exists idx_domains_wheel_id on domains(wheel_id);
create index if not exists idx_scores_wheel_id on scores(wheel_id);
create index if not exists idx_priorities_wheel_id on priorities(wheel_id);
create index if not exists idx_reflections_wheel_id on reflections(wheel_id);
create index if not exists idx_ideal_life_wheel_id on ideal_life(wheel_id);
create index if not exists idx_action_plans_wheel_id on action_plans(wheel_id);
create index if not exists idx_habits_action_plan_id on habits(action_plan_id);
create index if not exists idx_habit_completions_habit_id on habit_completions(habit_id);
create index if not exists idx_partnerships_users on partnerships(user_a_id, user_b_id);
create index if not exists idx_guest_sessions_token on guest_sessions(session_token);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger wheels_updated_at
  before update on wheels
  for each row execute procedure update_updated_at();
