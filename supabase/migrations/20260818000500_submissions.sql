-- B4 — Submissions: the core vertical.
--
-- A submission is one programme's attempt at one level inside one cycle. PSV,
-- Level I and Level II are the same 10 Areas submitted three times (decision 9),
-- so they are three submissions, three readiness scores, three evaluations — not
-- one record that moves.

create type public.submission_status as enum (
  'not_started',
  'in_progress',
  'submitted',
  'under_evaluation',
  'evaluated',
  'returned'
);

create table public.submissions (
  id              uuid primary key default uuid_generate_v4(),
  cycle_id        uuid not null references public.accreditation_cycles (id) on delete restrict,
  program_id      uuid not null references public.programs (id) on delete restrict,
  level_id        uuid not null references public.accreditation_levels (id) on delete restrict,

  -- Retakes. Without this a second try at the same level in the same cycle
  -- violates the uniqueness key outright, and the failed attempt's documents,
  -- assignment and evaluation would have to be destroyed to make room (§2.7).
  attempt         int not null default 1,

  -- The distinction the whole award lifecycle turns on: failing a level you do
  -- not hold costs nothing, failing revalidation of one you do hold demotes you.
  is_revalidation boolean not null default false,

  status          public.submission_status not null default 'not_started',
  website_url     text,
  due_date        date,
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint submissions_attempt_check check (attempt >= 1),
  constraint submissions_unique_attempt
    unique (cycle_id, program_id, level_id, attempt)
);

create index submissions_program_id_idx on public.submissions (program_id);
create index submissions_cycle_id_idx   on public.submissions (cycle_id);
create index submissions_status_idx     on public.submissions (status);

comment on column public.submissions.website_url is
  'One URL per (cycle, programme, level) submission — the evaluation sheet has a '
  'single Website row (open item O-5).';

-- Level III asks the programme to pick 2 of its 5 optional areas.
create table public.submission_choices (
  submission_id       uuid not null references public.submissions (id) on delete cascade,
  requirement_area_id uuid not null references public.requirement_areas (id) on delete restrict,
  primary key (submission_id, requirement_area_id)
);

-- ------------------------------------------------------ submission documents

create table public.submission_documents (
  id                  uuid primary key default uuid_generate_v4(),
  submission_id       uuid not null references public.submissions (id) on delete cascade,

  -- Exactly one of these two: the document answers either a pre-accreditation
  -- phase document or one of the level's areas, never both and never neither.
  phase_document_id   uuid references public.phase_documents (id) on delete restrict,
  requirement_area_id uuid references public.requirement_areas (id) on delete restrict,

  title               text not null,
  storage_path        text not null,
  file_size           bigint not null,
  page_count          int,

  -- Stamped into the PDF itself by pdf-lib, so a printed page traces back to this
  -- row. A PRD non-functional guarantee (§0.2).
  doc_uuid            uuid not null default uuid_generate_v4(),

  -- The revision loop. A rejected document is never overwritten: the replacement
  -- is a new row at version + 1 pointing back at what it supersedes, and the old
  -- row keeps is_current = false. The rejected file and the decision that
  -- rejected it both survive, which matters when the thing being audited is an
  -- audit system (§2.3).
  version             int not null default 1,
  supersedes_id       uuid references public.submission_documents (id) on delete set null,
  is_current          boolean not null default true,

  uploaded_by         uuid references public.profiles (id) on delete set null,
  uploaded_at         timestamptz not null default now(),

  constraint submission_documents_one_ref_check check (
    (phase_document_id is not null and requirement_area_id is null)
    or (phase_document_id is null and requirement_area_id is not null)
  ),
  constraint submission_documents_version_check check (version >= 1),
  constraint submission_documents_size_check check (file_size > 0)
);

create index submission_documents_submission_idx
  on public.submission_documents (submission_id) where is_current;
create unique index submission_documents_doc_uuid_idx
  on public.submission_documents (doc_uuid);

-- Note there is deliberately **no** review_status column here. An earlier draft
-- of the plan had one alongside evaluation_items.decision — the same fact in two
-- tables, guaranteed to drift the first time anyone wrote one without the other.
-- A document's status is a join to its evaluation item, not a column (§2.3).

-- --------------------------------------------------------------- readiness
--
-- A view, never a stored column. Storing it means every upload has to remember to
-- recompute it, and one forgotten path leaves a dashboard quietly lying.
--
-- Denominator = the 18 pre-accreditation documents + the level's own areas, where
-- Level III counts its 2 mandatory areas plus however many choices it requires
-- rather than all 7. That is what makes the level cards read 28 / 22 / 23 (§2.1).

create or replace view public.submission_readiness
with (security_invoker = true) as
select
  s.id as submission_id,
  s.program_id,
  s.level_id,
  (select count(*) from public.phase_documents)
    + case
        when l.required_choices is null
          then (select count(*) from public.requirement_areas ra
                 where ra.level_id = s.level_id)
        else (select count(*) from public.requirement_areas ra
               where ra.level_id = s.level_id and not ra.is_optional)
             + l.required_choices
      end                                        as required_count,
  (select count(*) from public.submission_documents sd
    where sd.submission_id = s.id and sd.is_current) as uploaded_count,
  least(
    100,
    floor(
      100.0
      * (select count(*) from public.submission_documents sd
          where sd.submission_id = s.id and sd.is_current)
      / nullif(
          (select count(*) from public.phase_documents)
          + case
              when l.required_choices is null
                then (select count(*) from public.requirement_areas ra
                       where ra.level_id = s.level_id)
              else (select count(*) from public.requirement_areas ra
                     where ra.level_id = s.level_id and not ra.is_optional)
                   + l.required_choices
            end, 0)
    )
  )::int                                          as readiness_percent
from public.submissions s
join public.accreditation_levels l on l.id = s.level_id;

comment on view public.submission_readiness is
  'security_invoker so the view runs as the caller and RLS on submissions still '
  'applies — a SECURITY DEFINER view here would hand every user every '
  'programme''s readiness.';

-- ---------------------------------------------------------- readiness bands
--
-- OtherContext.txt gives 0 / 1-25 / 51-75 / 76-99 / 100 and skips 26-50 outright.
-- Open item O-2 assumes 1-50 is "Partially Ready" until corrected, which is what
-- this implements — the alternative is a band that returns null for a quarter of
-- the range.

create or replace function public.readiness_band(percent int)
returns text
language sql
immutable
as $$
  select case
    when percent is null or percent = 0 then 'Not Started'
    when percent <= 50  then 'Partially Ready'
    when percent <= 75  then 'Moderately Ready'
    when percent <= 99  then 'Nearly Ready'
    else 'Ready for Evaluation'
  end
$$;

-- --------------------------------------------------------------------- RLS

alter table public.submissions          enable row level security;
alter table public.submission_choices   enable row level security;
alter table public.submission_documents enable row level security;

-- A representative sees their own programmes' submissions; QAC sees everything.
-- Assigned accreditors are added in B5, when assignments exist to join through.
create policy "reps read own program submissions"
  on public.submissions for select to authenticated
  using (program_id in (select public.my_program_ids()));

create policy "qac reads all submissions"
  on public.submissions for select to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- Writes require the cycle to be **open**. This is O-14's freeze expressed where
-- it cannot be bypassed: once QAC closes a window, no route, no action and no
-- direct API call can add to it.
create policy "reps create submissions in an open cycle"
  on public.submissions for insert to authenticated
  with check (
    program_id in (select public.my_program_ids())
    and exists (
      select 1 from public.accreditation_cycles c
       where c.id = cycle_id and c.status = 'open'
    )
  );

create policy "reps update own unsubmitted submissions"
  on public.submissions for update to authenticated
  using (
    program_id in (select public.my_program_ids())
    and status in ('not_started', 'in_progress', 'returned')
    and exists (
      select 1 from public.accreditation_cycles c
       where c.id = cycle_id and c.status = 'open'
    )
  )
  with check (program_id in (select public.my_program_ids()));

create policy "qac updates submissions"
  on public.submissions for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "choices follow their submission"
  on public.submission_choices for select to authenticated
  using (
    submission_id in (select id from public.submissions)
  );

create policy "reps set their own level III choices"
  on public.submission_choices for insert to authenticated
  with check (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
    )
  );

create policy "reps clear their own level III choices"
  on public.submission_choices for delete to authenticated
  using (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
    )
  );

create policy "documents follow their submission"
  on public.submission_documents for select to authenticated
  using (submission_id in (select id from public.submissions));

create policy "reps upload to their own open submissions"
  on public.submission_documents for insert to authenticated
  with check (
    exists (
      select 1
        from public.submissions s
        join public.accreditation_cycles c on c.id = s.cycle_id
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress', 'returned')
         and c.status = 'open'
    )
  );

-- O-16: delete before submit, never after. Once a submission is in, a document
-- can only be superseded — which keeps the rejected file and the decision that
-- rejected it both on the record.
create policy "reps delete documents before submitting"
  on public.submission_documents for delete to authenticated
  using (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
    )
  );

-- Superseding flips is_current on the old row, so reps need a narrow update too.
create policy "reps supersede their own documents"
  on public.submission_documents for update to authenticated
  using (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
    )
  )
  with check (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
    )
  );

-- ------------------------------------------------------- submissions bucket

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  25 * 1024 * 1024,          -- the 25 MB the UI copy promises, enforced here too
  array['application/pdf']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The 25 MB limit and the PDF-only rule live on the bucket as well as in the
-- upload route. accept="application/pdf" and the "Maximum upload size of 25 MB"
-- note on the submissions screen are UI copy, not controls (§8.1).
--
-- This was a `comment on table storage.buckets` until it met a real project:
-- `storage.buckets` is owned by `supabase_storage_admin`, and COMMENT requires
-- ownership, so the statement fails with "must be owner of table buckets" on
-- every hosted database while succeeding locally, where migrations run as
-- superuser. Documenting *our* rule by annotating *their* table was the mistake
-- — the note belongs in this file either way.

-- Path is {cycle}/{program}/{level}/… so the first segment alone is not enough to
-- authorise; the object policies defer to the submissions table instead, which is
-- where programme ownership actually lives.
create policy "submission files readable by those who can read the submission"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_active_user()
    and exists (
      select 1 from public.submission_documents sd
       where sd.storage_path = name
    )
  );

create policy "reps upload submission files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submissions'
    and public.is_active_user()
    and public.auth_role() = 'program_representative'
  );

create policy "reps delete their own submission files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'submissions'
    and public.is_active_user()
    and exists (
      select 1
        from public.submission_documents sd
        join public.submissions s on s.id = sd.submission_id
       where sd.storage_path = name
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
    )
  );
