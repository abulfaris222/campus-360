-- Smart Campus 360: Marketplace tables + Row Level Security

create extension if not exists pgcrypto;

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 100),
  price numeric(10,2) not null check (price > 0),
  condition text not null check (condition in ('Like new', 'Good', 'Used')),
  category text not null check (category in ('Calculators', 'Books', 'Lab & Drawing', 'Bags', 'Electronics')),
  description text,
  created_at timestamptz not null default now()
);

alter table public.marketplace_listings enable row level security;

drop policy if exists "Authenticated users can view marketplace listings" on public.marketplace_listings;
create policy "Authenticated users can view marketplace listings"
on public.marketplace_listings for select to authenticated
using (true);

drop policy if exists "Users can create their own marketplace listings" on public.marketplace_listings;
create policy "Users can create their own marketplace listings"
on public.marketplace_listings for insert to authenticated
with check (auth.uid() = seller_id);

drop policy if exists "Users can update their own marketplace listings" on public.marketplace_listings;
create policy "Users can update their own marketplace listings"
on public.marketplace_listings for update to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Users can delete their own marketplace listings" on public.marketplace_listings;
create policy "Users can delete their own marketplace listings"
on public.marketplace_listings for delete to authenticated
using (auth.uid() = seller_id);

create table if not exists public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

alter table public.marketplace_messages enable row level security;

drop policy if exists "Users can view their marketplace messages" on public.marketplace_messages;
create policy "Users can view their marketplace messages"
on public.marketplace_messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "Users can send marketplace messages" on public.marketplace_messages;
create policy "Users can send marketplace messages"
on public.marketplace_messages for insert to authenticated
with check (auth.uid() = sender_id and sender_id <> recipient_id);

create index if not exists marketplace_listings_created_at_idx on public.marketplace_listings(created_at desc);
create index if not exists marketplace_listings_category_idx on public.marketplace_listings(category);
create index if not exists marketplace_messages_listing_idx on public.marketplace_messages(listing_id, created_at desc);
