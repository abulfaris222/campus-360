-- Smart Campus 360: Lost & Found database

create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null check (char_length(trim(item_name)) between 2 and 120),
  place text not null check (char_length(trim(place)) between 2 and 120),
  kind text not null default 'Lost' check (kind in ('Lost', 'Found')),
  details text,
  photo_url text,
  status text not null default 'Open' check (status in ('Open', 'Returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lost_found_items add column if not exists photo_url text;
alter table public.lost_found_items add column if not exists updated_at timestamptz not null default now();
alter table public.lost_found_items drop constraint if exists lost_found_items_status_check;
alter table public.lost_found_items add constraint lost_found_items_status_check check (status in ('Open', 'Returned'));
alter table public.lost_found_items enable row level security;

drop policy if exists "Authenticated users can view lost found posts" on public.lost_found_items;
create policy "Authenticated users can view lost found posts"
on public.lost_found_items for select to authenticated using (true);

drop policy if exists "Users can create lost found posts" on public.lost_found_items;
create policy "Users can create lost found posts"
on public.lost_found_items for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their lost found posts" on public.lost_found_items;
create policy "Users can update their lost found posts"
on public.lost_found_items for update to authenticated
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their lost found posts" on public.lost_found_items;
create policy "Users can delete their lost found posts"
on public.lost_found_items for delete to authenticated using (auth.uid() = user_id);

create index if not exists lost_found_created_idx on public.lost_found_items(created_at desc);
create index if not exists lost_found_kind_status_idx on public.lost_found_items(kind, status, created_at desc);

-- Photo storage: one public bucket, but only authenticated users can upload/delete.
insert into storage.buckets (id, name, public)
values ('lost-found', 'lost-found', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload lost found photos" on storage.objects;
create policy "Authenticated users can upload lost found photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'lost-found');

drop policy if exists "Authenticated users can view lost found photos" on storage.objects;
create policy "Authenticated users can view lost found photos"
on storage.objects for select to authenticated
using (bucket_id = 'lost-found');

drop policy if exists "Users can delete their lost found photos" on storage.objects;
create policy "Users can delete their lost found photos"
on storage.objects for delete to authenticated
using (bucket_id = 'lost-found' and (storage.foldername(name))[1] = auth.uid()::text);

-- Secure contact messages: users can contact a post owner without exposing email/phone.
create table if not exists public.lost_found_messages (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.lost_found_items(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

alter table public.lost_found_messages enable row level security;

drop policy if exists "Users can view their lost found messages" on public.lost_found_messages;
create policy "Users can view their lost found messages"
on public.lost_found_messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send lost found messages" on public.lost_found_messages;
create policy "Users can send lost found messages"
on public.lost_found_messages for insert to authenticated
with check (auth.uid() = sender_id and sender_id <> recipient_id);

drop policy if exists "Recipients can mark lost found messages read" on public.lost_found_messages;
create policy "Recipients can mark lost found messages read"
on public.lost_found_messages for update to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

create index if not exists lost_found_messages_recipient_idx on public.lost_found_messages(recipient_id, read_at, created_at desc);
create index if not exists lost_found_messages_item_idx on public.lost_found_messages(item_id, created_at desc);
