-- Smart Campus 360: Complaints + staff/admin authorization + replies

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

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  category text not null check (category in ('Facilities', 'Electrical', 'Cleanliness', 'Network', 'Other')),
  location text not null check (char_length(trim(location)) between 2 and 120),
  details text,
  status text not null default 'Submitted' check (status in ('Submitted', 'In Progress', 'Resolved')),
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

drop policy if exists "Users can view their own complaints" on public.complaints;
create policy "Users can view their own complaints"
on public.complaints for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can submit complaints" on public.complaints;
create policy "Users can submit complaints"
on public.complaints for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own complaints" on public.complaints;
create policy "Users can update their own complaints"
on public.complaints for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Staff and admins can view all complaints" on public.complaints;
create policy "Staff and admins can view all complaints"
on public.complaints for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')));

drop policy if exists "Staff and admins can update complaints" on public.complaints;
create policy "Staff and admins can update complaints"
on public.complaints for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')))
with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin')));

drop policy if exists "Admins can delete complaints" on public.complaints;
create policy "Admins can delete complaints"
on public.complaints for delete to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create index if not exists complaints_user_idx on public.complaints(user_id, created_at desc);
create index if not exists complaints_status_idx on public.complaints(status, created_at desc);

create table if not exists public.complaint_replies (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.complaint_replies enable row level security;

drop policy if exists "Complaint participants can view replies" on public.complaint_replies;
create policy "Complaint participants can view replies"
on public.complaint_replies for select to authenticated
using (
  sender_id = auth.uid()
  or exists (select 1 from public.complaints c where c.id = complaint_id and c.user_id = auth.uid())
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

drop policy if exists "Staff and admins can send complaint replies" on public.complaint_replies;
create policy "Staff and admins can send complaint replies"
on public.complaint_replies for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff', 'admin'))
);

create index if not exists complaint_replies_complaint_idx on public.complaint_replies(complaint_id, created_at asc);
create index if not exists complaint_replies_sender_idx on public.complaint_replies(sender_id, created_at desc);
