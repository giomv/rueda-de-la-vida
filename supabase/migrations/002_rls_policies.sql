-- Enable RLS on all tables
alter table profiles enable row level security;
alter table wheels enable row level security;
alter table domains enable row level security;
alter table scores enable row level security;
alter table priorities enable row level security;
alter table reflections enable row level security;
alter table ideal_life enable row level security;
alter table action_plans enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table partnerships enable row level security;
alter table shared_wheels enable row level security;
alter table guest_sessions enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Wheels: users can CRUD their own wheels
create policy "Users can view own wheels"
  on wheels for select using (auth.uid() = user_id);

create policy "Users can create wheels"
  on wheels for insert with check (auth.uid() = user_id or is_guest = true);

create policy "Users can update own wheels"
  on wheels for update using (auth.uid() = user_id);

create policy "Users can delete own wheels"
  on wheels for delete using (auth.uid() = user_id);

-- Domains: access through wheel ownership
create policy "Users can view domains of own wheels"
  on domains for select using (
    exists (select 1 from wheels where wheels.id = domains.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create domains for own wheels"
  on domains for insert with check (
    exists (select 1 from wheels where wheels.id = domains.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update domains of own wheels"
  on domains for update using (
    exists (select 1 from wheels where wheels.id = domains.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can delete domains of own wheels"
  on domains for delete using (
    exists (select 1 from wheels where wheels.id = domains.wheel_id and wheels.user_id = auth.uid())
  );

-- Scores
create policy "Users can view scores of own wheels"
  on scores for select using (
    exists (select 1 from wheels where wheels.id = scores.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create scores for own wheels"
  on scores for insert with check (
    exists (select 1 from wheels where wheels.id = scores.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update scores of own wheels"
  on scores for update using (
    exists (select 1 from wheels where wheels.id = scores.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can delete scores of own wheels"
  on scores for delete using (
    exists (select 1 from wheels where wheels.id = scores.wheel_id and wheels.user_id = auth.uid())
  );

-- Priorities
create policy "Users can view priorities of own wheels"
  on priorities for select using (
    exists (select 1 from wheels where wheels.id = priorities.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create priorities for own wheels"
  on priorities for insert with check (
    exists (select 1 from wheels where wheels.id = priorities.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update priorities of own wheels"
  on priorities for update using (
    exists (select 1 from wheels where wheels.id = priorities.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can delete priorities of own wheels"
  on priorities for delete using (
    exists (select 1 from wheels where wheels.id = priorities.wheel_id and wheels.user_id = auth.uid())
  );

-- Reflections
create policy "Users can view reflections of own wheels"
  on reflections for select using (
    exists (select 1 from wheels where wheels.id = reflections.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create reflections for own wheels"
  on reflections for insert with check (
    exists (select 1 from wheels where wheels.id = reflections.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update reflections of own wheels"
  on reflections for update using (
    exists (select 1 from wheels where wheels.id = reflections.wheel_id and wheels.user_id = auth.uid())
  );

-- Ideal Life
create policy "Users can view ideal_life of own wheels"
  on ideal_life for select using (
    exists (select 1 from wheels where wheels.id = ideal_life.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create ideal_life for own wheels"
  on ideal_life for insert with check (
    exists (select 1 from wheels where wheels.id = ideal_life.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update ideal_life of own wheels"
  on ideal_life for update using (
    exists (select 1 from wheels where wheels.id = ideal_life.wheel_id and wheels.user_id = auth.uid())
  );

-- Action Plans
create policy "Users can view action_plans of own wheels"
  on action_plans for select using (
    exists (select 1 from wheels where wheels.id = action_plans.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can create action_plans for own wheels"
  on action_plans for insert with check (
    exists (select 1 from wheels where wheels.id = action_plans.wheel_id and wheels.user_id = auth.uid())
  );

create policy "Users can update action_plans of own wheels"
  on action_plans for update using (
    exists (select 1 from wheels where wheels.id = action_plans.wheel_id and wheels.user_id = auth.uid())
  );

-- Habits
create policy "Users can view habits of own plans"
  on habits for select using (
    exists (
      select 1 from action_plans ap
      join wheels w on w.id = ap.wheel_id
      where ap.id = habits.action_plan_id and w.user_id = auth.uid()
    )
  );

create policy "Users can create habits for own plans"
  on habits for insert with check (
    exists (
      select 1 from action_plans ap
      join wheels w on w.id = ap.wheel_id
      where ap.id = habits.action_plan_id and w.user_id = auth.uid()
    )
  );

create policy "Users can update habits of own plans"
  on habits for update using (
    exists (
      select 1 from action_plans ap
      join wheels w on w.id = ap.wheel_id
      where ap.id = habits.action_plan_id and w.user_id = auth.uid()
    )
  );

create policy "Users can delete habits of own plans"
  on habits for delete using (
    exists (
      select 1 from action_plans ap
      join wheels w on w.id = ap.wheel_id
      where ap.id = habits.action_plan_id and w.user_id = auth.uid()
    )
  );

-- Habit Completions
create policy "Users can view own habit completions"
  on habit_completions for select using (
    exists (
      select 1 from habits h
      join action_plans ap on ap.id = h.action_plan_id
      join wheels w on w.id = ap.wheel_id
      where h.id = habit_completions.habit_id and w.user_id = auth.uid()
    )
  );

create policy "Users can create habit completions"
  on habit_completions for insert with check (
    exists (
      select 1 from habits h
      join action_plans ap on ap.id = h.action_plan_id
      join wheels w on w.id = ap.wheel_id
      where h.id = habit_completions.habit_id and w.user_id = auth.uid()
    )
  );

create policy "Users can delete habit completions"
  on habit_completions for delete using (
    exists (
      select 1 from habits h
      join action_plans ap on ap.id = h.action_plan_id
      join wheels w on w.id = ap.wheel_id
      where h.id = habit_completions.habit_id and w.user_id = auth.uid()
    )
  );

-- Partnerships
create policy "Users can view own partnerships"
  on partnerships for select using (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

create policy "Users can create partnerships"
  on partnerships for insert with check (auth.uid() = user_a_id);

create policy "Users can update own partnerships"
  on partnerships for update using (
    auth.uid() = user_a_id or auth.uid() = user_b_id
  );

-- Shared Wheels
create policy "Partners can view shared wheels"
  on shared_wheels for select using (
    exists (
      select 1 from partnerships p
      where p.id = shared_wheels.partnership_id
      and (p.user_a_id = auth.uid() or p.user_b_id = auth.uid())
      and p.status = 'active'
    )
  );

create policy "Users can share own wheels"
  on shared_wheels for insert with check (auth.uid() = shared_by);

-- Guest Sessions
create policy "Anyone can create guest sessions"
  on guest_sessions for insert with check (true);

create policy "Guest sessions are readable by token"
  on guest_sessions for select using (true);
