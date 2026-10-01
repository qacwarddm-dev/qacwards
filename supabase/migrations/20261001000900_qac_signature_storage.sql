-- QAC Personnel / Admin have an e-signature pad on their own profile, but the
-- signatures bucket only accepted writes from accreditors, so Save was rejected.

drop policy if exists "accreditors write their own signature" on storage.objects;
create policy "accreditors write their own signature"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'signatures'
    and (public.acts_as_accreditor() or public.auth_role() in ('qac_personnel', 'qac_admin'))
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "accreditors replace their own signature" on storage.objects;
create policy "accreditors replace their own signature"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'signatures'
    and (public.acts_as_accreditor() or public.auth_role() in ('qac_personnel', 'qac_admin'))
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "accreditors delete their own signature" on storage.objects;
create policy "accreditors delete their own signature"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'signatures'
    and (public.acts_as_accreditor() or public.auth_role() in ('qac_personnel', 'qac_admin'))
    and (storage.foldername(name))[1] = auth.uid()::text
  );
