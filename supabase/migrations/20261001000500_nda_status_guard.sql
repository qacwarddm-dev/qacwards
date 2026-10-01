drop policy if exists "users file their own nda" on public.ndas;
create policy "users file their own nda"
  on public.ndas for insert to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'review'
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1 from public.nda_issuances i
       where i.file_id = ndas.file_id and i.profile_id = auth.uid()
    )
  );

drop policy if exists "users refile their own nda" on public.ndas;
create policy "users refile their own nda"
  on public.ndas for update to authenticated
  using (profile_id = auth.uid() and status in ('review', 'returned'))
  with check (
    profile_id = auth.uid()
    and status = 'review'
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1 from public.nda_issuances i
       where i.file_id = ndas.file_id and i.profile_id = auth.uid()
    )
  );
