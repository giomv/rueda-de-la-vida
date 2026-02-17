-- Allow any authenticated user to read profiles (display_name).
-- Needed so collaborators can see the creator name on shared IAL cards.

drop policy "Users can view own profile" on profiles;

create policy "Authenticated users can view profiles"
  on profiles for select
  using (auth.role() = 'authenticated');
