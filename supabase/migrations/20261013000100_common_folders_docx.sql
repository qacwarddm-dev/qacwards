-- Client feedback 2026-10-13: QAC organises Common Documents into folders, and
-- uploads Word files (.docx) as well as PDFs.

create table if not exists public.common_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);

create unique index if not exists common_folders_name_idx on public.common_folders (lower(btrim(name)));

alter table public.common_folders enable row level security;

drop policy if exists "reps with an nda read common folders" on public.common_folders;
create policy "reps with an nda read common folders"
  on public.common_folders for select to authenticated
  using (public.has_nda());

drop policy if exists "qac manages common folders" on public.common_folders;
create policy "qac manages common folders"
  on public.common_folders for all to authenticated
  using (public.is_qac())
  with check (public.is_qac());

alter table public.common_documents
  add column if not exists folder_id uuid references public.common_folders (id) on delete set null;

create index if not exists common_documents_folder_idx on public.common_documents (folder_id);

update storage.buckets
   set allowed_mime_types = array[
         'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'common-docs';
