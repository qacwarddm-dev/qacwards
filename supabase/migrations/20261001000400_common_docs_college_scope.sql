alter table public.common_documents
  add column if not exists college_codes text[] not null default '{}';

update public.common_documents
   set college_codes = string_to_array(regexp_replace(visible_to, ' only$', ''), ', ')
 where visible_to <> 'All program reps' and college_codes = '{}';

create or replace function public.can_see_common_doc(p_colleges text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_nda() and (
    coalesce(cardinality(p_colleges), 0) = 0
    or exists (
      select 1
        from public.profiles p
        join public.colleges c on c.id = p.college_id
       where p.id = auth.uid()
         and c.code = any (p_colleges)
    )
  )
$$;

grant execute on function public.can_see_common_doc(text[]) to authenticated;

drop policy if exists "common documents need an NDA" on public.common_documents;
create policy "common documents need an NDA and the right college"
  on public.common_documents for select to authenticated
  using (public.can_see_common_doc(college_codes));

drop policy if exists "common-docs bucket needs an NDA" on storage.objects;
create policy "common-docs bucket follows the document row"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'common-docs'
    and exists (select 1 from public.common_documents d where d.storage_path = storage.objects.name)
  );

create or replace function public.count_common_document_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.common_documents set view_count = view_count + 1
   where id = p_id and (
     public.is_qac() or public.can_see_common_doc(college_codes)
   )
$$;
