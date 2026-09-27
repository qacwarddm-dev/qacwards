-- Program Rep revisions from the client's SYSTEM DESIGN FORMAT (2026-09-27).

-- ------------------------------------------------ upload → QAC + accreditors

alter type public.notification_kind add value if not exists 'document_uploaded';

create or replace function public.notify_document_uploaded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program text;
  v_level   text;
  v_title   text;
  v_body    text;
  v_who     record;
begin
  select p.name, l.name into v_program, v_level
    from public.submissions s
    join public.programs p on p.id = s.program_id
    join public.accreditation_levels l on l.id = s.level_id
   where s.id = new.submission_id;

  v_title := 'New upload: ' || new.title;
  v_body  := coalesce(v_program, 'a programme') || ' · ' || coalesce(v_level, '');

  for v_who in
    select id from public.profiles
     where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_who.id, 'document_uploaded', v_title, v_body, '/portal/dashboard?uploads=all',
      new.uploaded_by, false
    );
  end loop;

  for v_who in
    select distinct aa.profile_id as id
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.submission_id = new.submission_id
       and aa.response <> 'rejected'
  loop
    perform public.notify_user(
      v_who.id, 'document_uploaded', v_title, v_body, '/portal/evaluation',
      new.uploaded_by, false
    );
  end loop;

  return null;
end;
$$;

create trigger notify_document_uploaded
  after insert on public.submission_documents
  for each row execute function public.notify_document_uploaded();

-- ------------------------------------------------------------ NDA checking
--
-- Every downloaded NDA template carries a unique file id printed on the page.
-- The signed, notarized scan is uploaded with that id and the notarial
-- details typed in; the id must be one issued to the same user. Rows filed
-- before this migration have no id and no longer unlock the gate.

create table public.nda_issuances (
  file_id    text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  issued_at  timestamptz not null default now()
);

create index nda_issuances_profile_idx on public.nda_issuances (profile_id);

alter table public.nda_issuances enable row level security;

create policy "users read their own nda issuances"
  on public.nda_issuances for select to authenticated
  using (profile_id = auth.uid() or public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "users are issued their own nda"
  on public.nda_issuances for insert to authenticated
  with check (profile_id = auth.uid());

alter table public.ndas
  add column file_id         text references public.nda_issuances (file_id),
  add column notary_attorney text,
  add column notary_doc_no   text,
  add column notary_page_no  text,
  add column notary_book_no  text,
  add column notary_series   int,
  add constraint ndas_notarial_complete check (
    file_id is null or (
      length(trim(notary_attorney)) > 0
      and length(trim(notary_doc_no)) > 0
      and length(trim(notary_page_no)) > 0
      and length(trim(notary_book_no)) > 0
      and notary_series between 2000 and 2100
    )
  );

drop policy "users file their own nda" on public.ndas;

create policy "users file their own nda"
  on public.ndas for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.nda_issuances i
       where i.file_id = ndas.file_id and i.profile_id = auth.uid()
    )
  );

create policy "users refile their own nda"
  on public.ndas for update to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.nda_issuances i
       where i.file_id = ndas.file_id and i.profile_id = auth.uid()
    )
  );

create or replace function public.has_nda()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.ndas n
      join public.profiles p on p.id = n.profile_id
     where n.profile_id = auth.uid()
       and n.file_id is not null
       and p.is_active
  )
$$;

-- --------------------------------------- per-programme repository folders
--
-- The six AACCUP/COPC folders are shared reference rows. A representative's
-- Rename / Delete on one only changes how it appears for their own programme.

create table public.repository_folder_prefs (
  program_id   uuid not null references public.programs (id) on delete cascade,
  folder_id    uuid not null references public.repository_folders (id) on delete cascade,
  display_name text,
  hidden       boolean not null default false,
  primary key (program_id, folder_id)
);

alter table public.repository_folder_prefs enable row level security;

create policy "reps manage their own folder prefs"
  on public.repository_folder_prefs for all to authenticated
  using (program_id in (select public.my_program_ids()))
  with check (program_id in (select public.my_program_ids()));

create policy "qac reads folder prefs"
  on public.repository_folder_prefs for select to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));
