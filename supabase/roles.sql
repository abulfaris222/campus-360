-- Smart Campus 360: user profiles and roles
-- Run this once in Supabase SQL Editor after complaints.sql.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  register_number text unique not null,
  role text not null default 'student' check (role in ('student', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

-- Create profiles for accounts that already exist.
insert into public.profiles (id, register_number, role)
select id, split_part(email, '@', 1), 'student'
from auth.users
where email is not null
on conflict (id) do nothing;

-- Automatically create a student profile for future accounts.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, register_number, role)
  values (new.id, split_part(new.email, '@', 1), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- IMPORTANT: change admin001 to the register number you want to use as the admin account.
-- Example:
-- update public.profiles set role = 'admin' where register_number = 'admin001';

create index if not exists profiles_role_idx on public.profiles(role);
