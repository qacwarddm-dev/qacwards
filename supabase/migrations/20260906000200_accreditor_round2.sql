-- Round 2 §2–§4 — dual-role accreditors, editable specialty, and the e-signature.
--
-- Three client notes, one migration, because they all hang off `profiles`:
--   §2 QAC Admin promotes a QAC Personnel account to also act as an Internal
--      Accreditor (an ADD, not a swap — the note says "add").
--   §3 the accreditor's specialty becomes writable, by the accreditor and by
--      QAC Admin, through the same `accreditor_expertise` rows.
--   §4 the signature is captured once on the profile and reused wherever
--      sign-off is rendered, so it is a bucket path on `profiles`.

-- ------------------------------------------------------- §2 the second role
--
-- A boolean beside `role`, not a second enum column and not a roles table.
-- `auth_role()` returns exactly one value and every policy written since B2 is
-- phrased against it; widening that return would mean revisiting all of them for
-- one use case. What the flag actually unlocks is UI and eligibility — the RLS
-- an accreditor needs is already keyed on `my_assignment_ids()` (team
-- membership), not on the role, so a QAC Personnel put on a team can already
-- read the assignment and its sheet.

alter table public.profiles
  add column if not exists is_internal_accreditor boolean not null default false;

comment on column public.profiles.is_internal_accreditor is
  'Round 2 §2: a QAC Personnel account that ALSO acts as an Internal Accreditor. '
  'Meaningless on a profile whose role is already internal_accreditor — read it '
  'through acts_as_accreditor(), never on its own.';

alter table public.profiles
  add column if not exists signature_path text;

comment on column public.profiles.signature_path is
  'Round 2 §4: bucket-relative key in the private `signatures` bucket '
  '({profile_id}/signature.png). Null until the accreditor draws or types one.';

create or replace function public.acts_as_accreditor(target uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = target
       and p.is_active
       and (p.role = 'internal_accreditor' or p.is_internal_accreditor)
  )
$$;

comment on function public.acts_as_accreditor(uuid) is
  'The one definition of "may evaluate": the internal_accreditor role, or any '
  'active profile the QAC Admin has flagged as also acting as one.';

-- --------------------------------------------- profiles column-level guard
--
-- RLS is row-level, so "update own avatar" — `id = auth.uid()` in USING and
-- WITH CHECK — has always let a user write ANY column of their own row,
-- including `role`. The policy comment claimed otherwise and the app never
-- exercised it, so it went unnoticed; §3 and §4 now genuinely need a
-- self-service write to `profiles`, which makes the gap load-bearing.
--
-- A trigger, not a rewritten policy: Postgres has no column-level WITH CHECK,
-- and splitting the write into a definer function would move the whole avatar
-- and signature path off RLS. `auth.uid() is null` lets the service role
-- through, which is what seeds and the auth trigger run as.

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.auth_role() = 'qac_admin' then
    return new;
  end if;

  if new.role                   is distinct from old.role
  or new.is_internal_accreditor is distinct from old.is_internal_accreditor
  or new.is_active              is distinct from old.is_active
  or new.webmail                is distinct from old.webmail
  or new.campus_id              is distinct from old.campus_id
  or new.college_id             is distinct from old.college_id
  or new.position_id            is distinct from old.position_id then
    raise exception 'Only a QAC Admin may change role, status or identity fields'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_columns on public.profiles;
create trigger guard_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- --------------------------------------------------- §3 specialty is writable
--
-- B2 gave `accreditor_expertise` a SELECT policy and nothing else, so the table
-- was service-role-only. Two entry points, one pair of rows: the accreditor
-- editing their own profile, and QAC Admin editing theirs from User Management.
-- Writes are delete-then-insert of the whole set, so both verbs are needed.

drop policy if exists "accreditors add their own expertise" on public.accreditor_expertise;
create policy "accreditors add their own expertise"
  on public.accreditor_expertise for insert to authenticated
  with check (profile_id = auth.uid() and public.acts_as_accreditor());

drop policy if exists "accreditors drop their own expertise" on public.accreditor_expertise;
create policy "accreditors drop their own expertise"
  on public.accreditor_expertise for delete to authenticated
  using (profile_id = auth.uid() and public.acts_as_accreditor());

drop policy if exists "qac admin adds any expertise" on public.accreditor_expertise;
create policy "qac admin adds any expertise"
  on public.accreditor_expertise for insert to authenticated
  with check (public.auth_role() = 'qac_admin');

drop policy if exists "qac admin drops any expertise" on public.accreditor_expertise;
create policy "qac admin drops any expertise"
  on public.accreditor_expertise for delete to authenticated
  using (public.auth_role() = 'qac_admin');

-- The picker on the assignment screen lists an accreditor's expertise, and QAC
-- Personnel could already read it. A teammate on the same assignment could not,
-- which blanks the Expertise column on the shared sheet for the very people
-- working the sheet — the same shape 20260822000100 fixed for names.
drop policy if exists "assignment participants read each other's expertise" on public.accreditor_expertise;
create policy "assignment participants read each other's expertise"
  on public.accreditor_expertise for select to authenticated
  using (
    profile_id in (
      select aa.profile_id
        from public.assignment_accreditors aa
       where aa.assignment_id in (select public.my_assignment_ids())
    )
  );

-- ------------------------------------------------------ §4 signatures bucket
--
-- Private like every other bucket (plans/BACKEND.md §2.8). Smaller and
-- narrower than avatars: one PNG, drawn or typed in the browser, capped well
-- below a photo because it is line art on transparency.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signatures',
  'signatures',
  false,
  512 * 1024,
  array['image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Read is deliberately narrower than avatars', which any signed-in user may
-- fetch. A signature is a person's mark of authorship: it goes to its owner, to
-- QAC, and to the teammates who share an assignment with them and therefore see
-- the sign-off block on the shared sheet. Nobody else, including representatives.
drop policy if exists "signatures are readable by their owner, qac and teammates" on storage.objects;
create policy "signatures are readable by their owner, qac and teammates"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'signatures'
    and public.is_active_user()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.auth_role() in ('qac_personnel', 'qac_admin')
      or exists (
        select 1
          from public.assignment_accreditors aa
         where aa.assignment_id in (select public.my_assignment_ids())
           and aa.profile_id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Writes are the owner's alone. QAC Admin may edit an accreditor's role and
-- specialty, but signing on someone's behalf is exactly what a signature must
-- not permit.
drop policy if exists "accreditors write their own signature" on storage.objects;
create policy "accreditors write their own signature"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'signatures'
    and public.acts_as_accreditor()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "accreditors replace their own signature" on storage.objects;
create policy "accreditors replace their own signature"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'signatures'
    and public.acts_as_accreditor()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "accreditors delete their own signature" on storage.objects;
create policy "accreditors delete their own signature"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'signatures'
    and public.acts_as_accreditor()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
