alter table public.programs
  add column if not exists deleted_at timestamptz;

drop policy if exists "reference is readable by authenticated users" on public.programs;
create policy "programs are readable unless deleted"
  on public.programs for select to authenticated
  using (deleted_at is null or public.auth_role() = 'qac_admin');
