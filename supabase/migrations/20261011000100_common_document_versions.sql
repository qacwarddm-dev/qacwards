-- Version control for common documents (client mockups, 2026-10-11): QAC uploads
-- a new version instead of replacing the file, every earlier version stays in a
-- history QAC can open or restore, and program reps only ever see the current
-- version.

alter table public.common_documents
  add column if not exists version integer not null default 1,
  add column if not exists change_note text;

create table if not exists public.common_document_versions (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.common_documents (id) on delete cascade,
  version      integer not null,
  title        text not null,
  storage_path text not null,
  file_name    text not null,
  file_size    bigint,
  change_note  text,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  uploaded_at  timestamptz not null,
  created_at   timestamptz not null default now(),
  constraint common_document_versions_unique unique (document_id, version)
);

create index if not exists common_document_versions_doc_idx
  on public.common_document_versions (document_id, version desc);

alter table public.common_document_versions enable row level security;

-- Program reps get no policy on purpose: a superseded version is a draft of a
-- policy the university no longer stands behind, and the common-docs bucket only
-- serves paths that a common_documents row currently points at.
drop policy if exists "qac reads common document history" on public.common_document_versions;
create policy "qac reads common document history"
  on public.common_document_versions for select to authenticated
  using (public.is_qac());

drop policy if exists "qac writes common document history" on public.common_document_versions;
create policy "qac writes common document history"
  on public.common_document_versions for insert to authenticated
  with check (public.is_qac());

-- Atomic: a version row and the document row move together or not at all, so a
-- failed call can never leave the history pointing at a file the document row
-- has already dropped. Invoker rights: the QAC-only policies above decide who
-- may call it.
create or replace function public.publish_common_document_version(
  p_document   uuid,
  p_path       text,
  p_file_size  bigint,
  p_title      text,
  p_category   text,
  p_visible_to text,
  p_colleges   text[],
  p_note       text
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  cur public.common_documents;
begin
  select * into cur from public.common_documents where id = p_document for update;
  if not found then
    raise exception 'That document no longer exists.' using errcode = 'no_data_found';
  end if;
  if cur.deleted_at is not null then
    raise exception 'Restore the document before uploading a new version.' using errcode = 'check_violation';
  end if;

  insert into public.common_document_versions
    (document_id, version, title, storage_path, file_name, file_size, change_note, uploaded_by, uploaded_at)
  values
    (cur.id, cur.version, cur.title, cur.storage_path, regexp_replace(cur.storage_path, '^.*/', ''),
     cur.file_size, cur.change_note, cur.uploaded_by, cur.updated_at);

  update public.common_documents
     set title         = p_title,
         category      = p_category,
         visible_to    = p_visible_to,
         college_codes = p_colleges,
         storage_path  = p_path,
         file_size     = p_file_size,
         content_text  = null,
         version       = cur.version + 1,
         change_note   = nullif(btrim(coalesce(p_note, '')), ''),
         uploaded_by   = auth.uid(),
         updated_at    = now()
   where id = cur.id;

  return cur.version + 1;
end;
$$;

grant execute on function public.publish_common_document_version(uuid, text, bigint, text, text, text, text[], text) to authenticated;

-- Restoring never rewrites history: the current version is archived, then the
-- chosen file becomes the newest version.
create or replace function public.restore_common_document_version(p_version uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v   public.common_document_versions;
  cur public.common_documents;
begin
  select * into v from public.common_document_versions where id = p_version;
  if not found then
    raise exception 'That version no longer exists.' using errcode = 'no_data_found';
  end if;
  select * into cur from public.common_documents where id = v.document_id for update;
  if cur.deleted_at is not null then
    raise exception 'Restore the document before restoring a version.' using errcode = 'check_violation';
  end if;

  insert into public.common_document_versions
    (document_id, version, title, storage_path, file_name, file_size, change_note, uploaded_by, uploaded_at)
  values
    (cur.id, cur.version, cur.title, cur.storage_path, regexp_replace(cur.storage_path, '^.*/', ''),
     cur.file_size, cur.change_note, cur.uploaded_by, cur.updated_at);

  update public.common_documents
     set title        = v.title,
         storage_path = v.storage_path,
         file_size    = v.file_size,
         content_text = null,
         version      = cur.version + 1,
         change_note  = 'Restored v' || v.version,
         uploaded_by  = auth.uid(),
         updated_at   = now()
   where id = cur.id;

  return cur.version + 1;
end;
$$;

grant execute on function public.restore_common_document_version(uuid) to authenticated;
