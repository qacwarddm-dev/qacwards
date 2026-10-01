-- Client testing feedback: (1) QAC could not add a program in Program
-- Management because `programs` had no INSERT policy, so RLS rejected the row;
-- (2) deleted documents had no way back.

create policy "qac adds programs"
  on public.programs for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

alter table public.repository_files
  add column if not exists archived_at timestamptz;

update public.repository_files set archived_at = now() where is_archived and archived_at is null;

alter table public.common_documents
  add column if not exists deleted_at timestamptz;

drop policy if exists "common documents need an NDA and the right college" on public.common_documents;
create policy "common documents need an NDA and the right college"
  on public.common_documents for select to authenticated
  using (deleted_at is null and public.can_see_common_doc(college_codes));

create or replace function public.count_common_document_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.common_documents set view_count = view_count + 1
   where id = p_id and deleted_at is null and (
     public.is_qac() or public.can_see_common_doc(college_codes)
   )
$$;

drop policy if exists "reps read their own repository" on public.repository_files;
create policy "reps read their own repository"
  on public.repository_files for select to authenticated
  using (not is_archived and program_id in (select public.my_program_ids()));
