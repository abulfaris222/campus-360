-- Smart Campus 360: Lost & Found database

create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null check (char_length(trim(item_name)) between 2 and 120),
  place text not null check (char_length(trim(place)) between 2 and 120),
  kind text not null default 'Lost' check (kind in ('Lost', 'Found')),
  details text,
  status text not null default 'Open' check (status in ('Open', 'Claimed')),
  created_at timestamptz not null default now()
);

alter table public.lost_found_items enable row level security;

drop policy if exists "Authenticated users can view lost found posts" on public.lost_found_items;
create policy "Authenticated users can view lost found posts"
on public.lost_found_items for select to authenticated
using (true);

drop policy if exists "Users can create lost found posts" on public.lost_found_items;
create policy "Users can create lost found posts"
on public.lost_found_items for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their lost found posts" on public.lost_found_items;
create policy "Users can update their lost found posts"
on public.lost_found_items for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their lost found posts" on public.lost_found_items;
create policy "Users can delete their lost found posts"
on public.lost_found_items for delete to authenticated
using (auth.uid() = user_id);

create index if not exists lost_found_created_idx on public.lost_found_items(created_at desc);
create index if not exists lost_found_kind_status_idx on public.lost_found_items(kind, status, created_at desc);
