-- Client feedback 2026-10-20: a university-level common document (VMGO, Library,
-- Physical Plant, Administration, ...) is stored once and counts as already
-- uploaded for the matching Area of every PSV / Level I / Level II submission.
-- The link row follows the common document's current version, so a new VMGO
-- reaches every open submission without a copy.

alter table public.common_documents
  add column if not exists link_area_ordinal int check (link_area_ordinal between 1 and 10);

create unique index if not exists common_documents_link_area_idx
  on public.common_documents (link_area_ordinal)
  where link_area_ordinal is not null and deleted_at is null;

alter table public.submission_documents
  add column if not exists common_document_id uuid references public.common_documents (id) on delete cascade;

create index if not exists submission_documents_common_idx
  on public.submission_documents (common_document_id) where common_document_id is not null;

comment on column public.submission_documents.common_document_id is
  'Set when this row is the auto-link to a common document. storage_path and '
  'file_size are mirrored from it, but the file lives in the common-docs bucket.';

-- Levels III and IV name their areas differently, so only the ten shared Areas
-- of PSV / I / II are linkable. Only submissions a rep can still change are
-- touched: once handed in, the evidence under evaluation must not move.
create or replace function public.link_common_documents(p_doc uuid default null, p_sub uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_doc is not null then
    update public.submission_documents sd
       set storage_path = cd.storage_path,
           file_size    = greatest(coalesce(cd.file_size, 1), 1),
           title        = cd.title
      from public.common_documents cd
     where cd.id = p_doc and sd.common_document_id = cd.id and sd.is_current;

    delete from public.submission_documents sd
     using public.common_documents cd, public.submissions s, public.requirement_areas ra
     where cd.id = p_doc
       and sd.common_document_id = cd.id
       and sd.is_current
       and s.id = sd.submission_id
       and s.status in ('not_started', 'in_progress')
       and ra.id = sd.requirement_area_id
       and (cd.deleted_at is not null or cd.link_area_ordinal is distinct from ra.ordinal);
  end if;

  insert into public.submission_documents
    (submission_id, requirement_area_id, title, storage_path, file_size, version, is_current, content_text, common_document_id)
  select s.id, ra.id, cd.title, cd.storage_path, greatest(coalesce(cd.file_size, 1), 1), 1, true, '', cd.id
    from public.common_documents cd
    join public.submissions s on s.status in ('not_started', 'in_progress')
    join public.accreditation_levels l on l.id = s.level_id and l.code in ('PSV', 'I', 'II')
    join public.accreditation_cycles c on c.id = s.cycle_id and c.status = 'open'
    join public.requirement_areas ra on ra.level_id = s.level_id and ra.ordinal = cd.link_area_ordinal
   where cd.deleted_at is null
     and cd.link_area_ordinal is not null
     and (p_doc is null or cd.id = p_doc)
     and (p_sub is null or s.id = p_sub)
     and not exists (
       select 1 from public.submission_documents x
        where x.submission_id = s.id
          and x.requirement_area_id = ra.id
          and ((x.is_current and not x.is_draft) or x.common_document_id = cd.id)
     );
end;
$$;

revoke all on function public.link_common_documents(uuid, uuid) from public, anon, authenticated;

create or replace function public.common_document_linked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.link_common_documents(new.id, null);
  return new;
end;
$$;

drop trigger if exists common_documents_link on public.common_documents;
create trigger common_documents_link
  after insert or update of link_area_ordinal, deleted_at, storage_path, file_size, title
  on public.common_documents
  for each row execute function public.common_document_linked();

create or replace function public.submission_linked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.link_common_documents(null, new.id);
  return new;
end;
$$;

drop trigger if exists submissions_link_common on public.submissions;
create trigger submissions_link_common
  after insert on public.submissions
  for each row execute function public.submission_linked();

-- The rep reads the linked file through their own submission row, so the NDA
-- gate on the bucket does not lock them out of a document the system filled in.
drop policy if exists "linked common files are readable with their submission" on storage.objects;
create policy "linked common files are readable with their submission"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'common-docs'
    and exists (
      select 1 from public.submission_documents sd
       where sd.common_document_id is not null
         and sd.storage_path = storage.objects.name
         and sd.is_current
    )
  );
