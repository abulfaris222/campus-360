-- Allow staff/admin to see register numbers when identifying complaint,
-- marketplace, and lost/found posters.

alter table public.profiles enable row level security;

drop policy if exists "Staff and admins can view poster profiles" on public.profiles;
create policy "Staff and admins can view poster profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.profiles viewer
    where viewer.id = auth.uid()
      and viewer.role in ('staff', 'admin')
  )
);
