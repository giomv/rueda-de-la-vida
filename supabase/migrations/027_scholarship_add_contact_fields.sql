-- Add contact and location columns to scholarship_applications
alter table scholarship_applications
  add column email text,
  add column phone text,
  add column country text,
  add column city text;

-- Backfill existing rows from location column
update scholarship_applications
set
  email    = 'unknown@placeholder.com',
  phone    = '000000000',
  country  = coalesce(location, ''),
  city     = ''
where email is null;

-- Now enforce NOT NULL
alter table scholarship_applications
  alter column email set not null,
  alter column phone set not null,
  alter column country set not null,
  alter column city set not null;
