-- Smart Campus 360: Study Hub
-- Students: view/download only.
-- Staff/Admin: publish, edit, delete.

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text,
  subject text not null check (char_length(trim(subject)) between 2 and 120),
  material_type text not null default 'PDF' check (material_type in ('PDF', 'Notes', 'Video', 'Link', 'Other')),
  file_url text not null,
  published_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_materials enable row level security;

drop policy if exists "Authenticated users can view study materials" on public.study_materials;
create policy "Authenticated users can view study materials"
on public.study_materials for select to authenticated
using (true);

drop policy if exists "Staff and admins can publish study materials" on public.study_materials;
create policy "Staff and admins can publish study materials"
on public.study_materials for insert to authenticated
with check (auth.uid() = published_by and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin')));

drop policy if exists "Staff and admins can edit study materials" on public.study_materials;
create policy "Staff and admins can edit study materials"
on public.study_materials for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin')))
with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin')));

drop policy if exists "Staff and admins can delete study materials" on public.study_materials;
create policy "Staff and admins can delete study materials"
on public.study_materials for delete to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin')));

create index if not exists study_materials_subject_idx on public.study_materials(subject, created_at desc);
create index if not exists study_materials_created_idx on public.study_materials(created_at desc);

-- Storage bucket for uploaded study files.
-- Public download URLs let students open/download files without exposing upload permissions.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  true,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/zip'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

-- Staff/admin can upload files. Files are stored under their auth user id.
drop policy if exists "Staff and admins can upload study files" on storage.objects;
create policy "Staff and admins can upload study files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'))
);

-- Staff/admin can replace or remove files they uploaded.
drop policy if exists "Staff and admins can update study files" on storage.objects;
create policy "Staff and admins can update study files"
on storage.objects for update to authenticated
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'))
)
with check (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'))
);

drop policy if exists "Staff and admins can delete study files" on storage.objects;
create policy "Staff and admins can delete study files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'study-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('staff','admin'))
);
