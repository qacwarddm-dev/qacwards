-- Client mockups (2026-10-01): per-document review, per-area indicator
-- ratings, per-accreditor signed reports, NDA verification, managed
-- templates/common documents, saved reports and the Director's settings.
--
-- Depends on 20260927000200_ia_evaluation_flow.sql and
-- 20260927000300_visit_evaluations.sql being applied first.

-- ------------------------------------------------------------ helpers

create or replace function public.is_qac()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.auth_role() in ('qac_personnel', 'qac_admin'), false)
$$;

create or replace function public.accepted_on_submission(p_submission uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.submission_id = p_submission
       and aa.profile_id = auth.uid()
       and aa.response = 'accepted'
  )
$$;

-- ------------------------------------------------- submission documents

alter table public.submission_documents
  add column if not exists upload_note text,
  add column if not exists is_draft boolean not null default false;

comment on column public.submission_documents.upload_note is
  'What the representative said they changed when resubmitting or replacing. '
  'Shown in the document''s history thread.';
comment on column public.submission_documents.is_draft is
  'Saved from the upload modal''s "Save draft": never current, never reviewed.';

-- ------------------------------------------------------ document reviews

create table if not exists public.document_reviews (
  id                     uuid primary key default gen_random_uuid(),
  submission_document_id uuid not null references public.submission_documents (id) on delete cascade,
  reviewer_id            uuid references public.profiles (id) on delete set null,
  decision               text not null check (decision in ('approved', 'returned', 'undone')),
  note                   text,
  created_at             timestamptz not null default now(),
  constraint document_reviews_return_needs_note
    check (decision <> 'returned' or length(btrim(coalesce(note, ''))) > 0)
);

create index if not exists document_reviews_doc_idx
  on public.document_reviews (submission_document_id, created_at desc);

alter table public.document_reviews enable row level security;

drop policy if exists "reviews follow their document" on public.document_reviews;
create policy "reviews follow their document"
  on public.document_reviews for select to authenticated
  using (submission_document_id in (select id from public.submission_documents));

drop policy if exists "qac and team review documents" on public.document_reviews;
create policy "qac and team review documents"
  on public.document_reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and (
      public.is_qac()
      or exists (
        select 1 from public.submission_documents sd
         where sd.id = submission_document_id
           and public.accepted_on_submission(sd.submission_id)
      )
    )
  );

create or replace function public.notify_document_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc record;
  v_rep record;
begin
  if new.decision <> 'returned' then
    return null;
  end if;

  select sd.title, s.program_id, p.name as program
    into v_doc
    from public.submission_documents sd
    join public.submissions s on s.id = sd.submission_id
    join public.programs p on p.id = s.program_id
   where sd.id = new.submission_document_id;

  for v_rep in
    select profile_id from public.program_reps where program_id = v_doc.program_id
  loop
    perform public.notify_user(
      v_rep.profile_id,
      'document_disapproved',
      'Needs revision: ' || v_doc.title || ' was returned.',
      new.note,
      '/portal/feedback',
      new.reviewer_id,
      true
    );
  end loop;
  return null;
end;
$$;

drop trigger if exists document_reviews_notify on public.document_reviews;
create trigger document_reviews_notify
  after insert on public.document_reviews
  for each row execute function public.notify_document_review();

-- --------------------------------------------------- accreditor reports

create sequence if not exists public.accreditor_report_seq start 101;

create table if not exists public.accreditor_reports (
  assignment_id    uuid not null references public.assignments (id) on delete cascade,
  accreditor_id    uuid not null references public.profiles (id) on delete cascade,
  overall_findings text,
  recommendation   text,
  status           text not null default 'draft'
                   check (status in ('draft', 'submitted', 'acknowledged', 'returned')),
  grand_mean       numeric(4, 2),
  signed_at        timestamptz,
  doc_code         text unique,
  qac_note         text,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (assignment_id, accreditor_id)
);

alter table public.accreditor_reports enable row level security;

drop policy if exists "reports readable by team and qac" on public.accreditor_reports;
create policy "reports readable by team and qac"
  on public.accreditor_reports for select to authenticated
  using (assignment_id in (select public.my_assignment_ids()) or public.is_qac());

drop policy if exists "accreditors draft their own report" on public.accreditor_reports;
create policy "accreditors draft their own report"
  on public.accreditor_reports for insert to authenticated
  with check (accreditor_id = auth.uid() and status = 'draft');

drop policy if exists "accreditors edit their unsigned report" on public.accreditor_reports;
create policy "accreditors edit their unsigned report"
  on public.accreditor_reports for update to authenticated
  using (accreditor_id = auth.uid() and status in ('draft', 'returned'))
  with check (accreditor_id = auth.uid() and status in ('draft', 'returned'));

drop policy if exists "qac reviews reports" on public.accreditor_reports;
create policy "qac reviews reports"
  on public.accreditor_reports for update to authenticated
  using (public.is_qac())
  with check (public.is_qac());

-- Signing is the only way into 'submitted', and it stamps the document ID,
-- so an accreditor cannot forge a signed state through the update policy.
create or replace function public.sign_accreditor_report(
  p_assignment uuid,
  p_findings   text,
  p_recommendation text,
  p_grand_mean numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_program text;
  v_qac record;
begin
  if coalesce(btrim(p_findings), '') = '' then
    raise exception 'Write the overall findings before signing.' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = p_assignment and profile_id = auth.uid() and response = 'accepted'
  ) then
    raise exception 'Only an accreditor on this assignment may sign it.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from public.accreditor_reports
     where assignment_id = p_assignment and accreditor_id = auth.uid()
       and status in ('submitted', 'acknowledged')
  ) then
    raise exception 'This report is already signed.' using errcode = 'check_violation';
  end if;

  v_code := 'QAC-EVAL-' || to_char(now() at time zone 'Asia/Manila', 'YYYY') || '-'
            || lpad(nextval('public.accreditor_report_seq')::text, 4, '0');

  insert into public.accreditor_reports
    (assignment_id, accreditor_id, overall_findings, recommendation, status, grand_mean, signed_at, doc_code, updated_at)
  values
    (p_assignment, auth.uid(), btrim(p_findings), btrim(coalesce(p_recommendation, '')), 'submitted', p_grand_mean, now(), v_code, now())
  on conflict (assignment_id, accreditor_id) do update
    set overall_findings = excluded.overall_findings,
        recommendation   = excluded.recommendation,
        status           = 'submitted',
        grand_mean       = excluded.grand_mean,
        signed_at        = excluded.signed_at,
        doc_code         = excluded.doc_code,
        qac_note         = null,
        updated_at       = now();

  select p.name into v_program
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
    join public.programs p on p.id = s.program_id
   where a.id = p_assignment;

  for v_qac in
    select id from public.profiles where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_qac.id, 'score_released',
      'Evaluation submitted: ' || coalesce(v_program, 'a program') || ' report was signed.',
      v_code, '/portal/assignment', auth.uid(), false
    );
  end loop;

  return v_code;
end;
$$;

revoke all on function public.sign_accreditor_report(uuid, text, text, numeric) from public;
grant execute on function public.sign_accreditor_report(uuid, text, text, numeric) to authenticated;

-- -------------------------------------------------------- area ratings

create table if not exists public.area_ratings (
  assignment_id       uuid not null references public.assignments (id) on delete cascade,
  accreditor_id       uuid not null references public.profiles (id) on delete cascade,
  requirement_area_id uuid not null references public.requirement_areas (id) on delete cascade,
  indicator           smallint not null check (indicator between 1 and 3),
  rating              smallint check (rating between 1 and 5),
  remark              text,
  updated_at          timestamptz not null default now(),
  primary key (assignment_id, accreditor_id, requirement_area_id, indicator)
);

alter table public.area_ratings enable row level security;

drop policy if exists "accreditors read ratings on their team" on public.area_ratings;
create policy "accreditors read ratings on their team"
  on public.area_ratings for select to authenticated
  using (assignment_id in (select public.my_assignment_ids()) or public.is_qac());

drop policy if exists "accreditors write their own ratings" on public.area_ratings;
create policy "accreditors write their own ratings"
  on public.area_ratings for all to authenticated
  using (
    accreditor_id = auth.uid()
    and not exists (
      select 1 from public.accreditor_reports r
       where r.assignment_id = area_ratings.assignment_id
         and r.accreditor_id = auth.uid()
         and r.status in ('submitted', 'acknowledged')
    )
  )
  with check (
    accreditor_id = auth.uid()
    and exists (
      select 1 from public.assignment_accreditors aa
       where aa.assignment_id = area_ratings.assignment_id
         and aa.profile_id = auth.uid()
         and aa.response = 'accepted'
    )
  );

-- ------------------------------------------------------ acting accreditor

alter table public.assignment_accreditors
  add column if not exists acting_reason text;

comment on column public.assignment_accreditors.acting_reason is
  'Set when QAC Personnel stand in as an internal accreditor (the reason chosen).';

-- --------------------------------------------------------------- NDAs

alter table public.ndas
  add column if not exists status text not null default 'review'
    check (status in ('review', 'verified', 'returned')),
  add column if not exists review_note text,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- NDAs filed before verification existed were already accepted by the gate.
update public.ndas set status = 'verified' where status = 'review' and reviewed_at is null
  and uploaded_at < '2026-10-01';

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
       and n.status = 'verified'
       and p.is_active
  )
$$;

drop policy if exists "users refile a returned nda" on public.ndas;
create policy "users refile a returned nda"
  on public.ndas for update to authenticated
  using (profile_id = auth.uid() and status = 'returned')
  with check (profile_id = auth.uid() and status = 'review');

drop policy if exists "qac verifies ndas" on public.ndas;
create policy "qac verifies ndas"
  on public.ndas for update to authenticated
  using (public.is_qac())
  with check (public.is_qac());

-- ------------------------------------------------------------ templates

alter table public.templates
  add column if not exists group_key text,
  add column if not exists version integer not null default 1,
  add column if not exists is_published boolean not null default true,
  add column if not exists change_note text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.template_versions (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.templates (id) on delete cascade,
  version      integer not null,
  storage_path text not null,
  file_name    text not null,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.template_versions enable row level security;

drop policy if exists "qac reads template history" on public.template_versions;
create policy "qac reads template history"
  on public.template_versions for select to authenticated
  using (public.is_qac());

drop policy if exists "qac writes template history" on public.template_versions;
create policy "qac writes template history"
  on public.template_versions for insert to authenticated
  with check (public.is_qac());

update storage.buckets
   set allowed_mime_types = array[
         'application/pdf',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
       ]
 where id = 'templates';

-- ----------------------------------------------------- common documents

alter table public.common_documents
  add column if not exists category text not null default 'Institutional',
  add column if not exists visible_to text not null default 'All program reps',
  add column if not exists view_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.count_common_document_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.common_documents set view_count = view_count + 1
   where id = p_id and (public.has_nda() or public.is_qac());
$$;

grant execute on function public.count_common_document_view(uuid) to authenticated;

-- ---------------------------------------------------- repository files

alter table public.repository_files
  add column if not exists valid_from date,
  add column if not exists valid_until date,
  add column if not exists cert_status text,
  add column if not exists level_id uuid references public.accreditation_levels (id);

create table if not exists public.repository_units (
  id         uuid primary key default gen_random_uuid(),
  location   text not null check (location in ('main', 'campus')),
  name       text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (location, name)
);

alter table public.repository_units enable row level security;

drop policy if exists "units readable" on public.repository_units;
create policy "units readable"
  on public.repository_units for select to authenticated using (true);

drop policy if exists "qac manages units" on public.repository_units;
create policy "qac manages units"
  on public.repository_units for all to authenticated
  using (public.is_qac()) with check (public.is_qac());

-- -------------------------------------------------------- saved reports

create table if not exists public.saved_reports (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  title      text not null,
  scope      text not null,
  filters    jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.saved_reports enable row level security;

drop policy if exists "qac manages reports" on public.saved_reports;
create policy "qac manages reports"
  on public.saved_reports for all to authenticated
  using (public.is_qac()) with check (public.is_qac());

-- --------------------------------------------------------- announcements

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  publish_on   date not null default current_date,
  audience     text not null default 'Public + all users',
  is_pinned    boolean not null default false,
  is_published boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.announcements enable row level security;

drop policy if exists "published announcements are public" on public.announcements;
create policy "published announcements are public"
  on public.announcements for select to anon, authenticated
  using (is_published and publish_on <= current_date or public.is_qac());

drop policy if exists "admin manages announcements" on public.announcements;
create policy "admin manages announcements"
  on public.announcements for all to authenticated
  using (public.auth_role() = 'qac_admin') with check (public.auth_role() = 'qac_admin');

-- ---------------------------------------------------------- site settings

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "settings readable" on public.site_settings;
create policy "settings readable"
  on public.site_settings for select to anon, authenticated using (true);

drop policy if exists "admin writes settings" on public.site_settings;
create policy "admin writes settings"
  on public.site_settings for all to authenticated
  using (public.auth_role() = 'qac_admin') with check (public.auth_role() = 'qac_admin');

-- ---------------------------------------------------------------- backups

create table if not exists public.system_backups (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('automatic', 'manual')),
  note         text,
  size_bytes   bigint,
  status       text not null check (status in ('ok', 'fail')),
  storage_path text,
  log          text,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.system_backups enable row level security;

drop policy if exists "admin reads backups" on public.system_backups;
create policy "admin reads backups"
  on public.system_backups for all to authenticated
  using (public.auth_role() = 'qac_admin') with check (public.auth_role() = 'qac_admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('backups', 'backups', false, 500 * 1024 * 1024, array['application/json'])
on conflict (id) do nothing;

drop policy if exists "admin reads backup objects" on storage.objects;
create policy "admin reads backup objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'backups' and public.auth_role() = 'qac_admin');

drop policy if exists "admin writes backup objects" on storage.objects;
create policy "admin writes backup objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'backups' and public.auth_role() = 'qac_admin');

-- --------------------------------------------------------------- profiles

alter table public.profiles
  add column if not exists mobile text,
  add column if not exists local_no text,
  add column if not exists notif_prefs jsonb not null default '{}'::jsonb;

-- ------------------------------------------------------------------ cycles

alter table public.accreditation_cycles
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles (id) on delete set null;
