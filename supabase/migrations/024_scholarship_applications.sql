-- Scholarship applications table (public form, no auth required to submit)
create table scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age smallint not null,
  institution text not null,
  career text not null,
  location text not null,
  building text not null,
  motivation text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table scholarship_applications enable row level security;

-- Anyone can insert (public form, no auth needed)
create policy "Anyone can submit scholarship application"
  on scholarship_applications for insert
  with check (true);

-- Only authenticated users can read (future admin page)
create policy "Authenticated users can read applications"
  on scholarship_applications for select
  using (auth.role() = 'authenticated');

-- Only authenticated users can update (future admin review)
create policy "Authenticated users can update applications"
  on scholarship_applications for update
  using (auth.role() = 'authenticated');

-- Only authenticated users can delete
create policy "Authenticated users can delete applications"
  on scholarship_applications for delete
  using (auth.role() = 'authenticated');
