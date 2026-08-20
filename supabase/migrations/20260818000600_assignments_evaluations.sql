-- B5 — Assignments, evaluations, and the award lifecycle.
--
-- The assignment unit is a **team of accreditors per (programme, level)**
-- (decision 5), sharing **one evaluation sheet** (decision 10). Not per-area, not
-- one-to-one.

create type public.assignment_status as enum (
  'assigned',
  'in_progress',
  'for_psv',
  'evaluated',
  'score_returned'
);

create type public.accreditor_response as enum ('pending', 'accepted', 'rejected');

create type public.evaluation_outcome as enum ('passed', 'failed');

create type public.evaluation_item_kind as enum (
  'narrative',
  'compliance_area',
  'best_practice',
  'website'
);

create type public.item_decision as enum ('pending', 'approved', 'disapproved');

create type public.extension_status as enum ('pending', 'approved', 'declined');

create type public.award_status as enum ('active', 'expired', 'superseded', 'revoked');

-- ------------------------------------------------------------- assignments

create table public.assignments (
  id            uuid primary key default uuid_generate_v4(),
  cycle_id      uuid not null references public.accreditation_cycles (id) on delete restrict,
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  assigned_by   uuid references public.profiles (id) on delete set null,
  status        public.assignment_status not null default 'assigned',
  due_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on column public.assignments.submission_id is
  'UNIQUE: one submission is assigned once. A retake is a different submission '
  'row (attempt + 1) and therefore gets its own assignment, which is how a '
  'failed attempt keeps its own history instead of being overwritten (§2.7).';

create table public.assignment_accreditors (
  assignment_id  uuid not null references public.assignments (id) on delete cascade,
  profile_id     uuid not null references public.profiles (id) on delete restrict,
  response       public.accreditor_response not null default 'pending',
  rejection_note text,
  responded_at   timestamptz,
  primary key (assignment_id, profile_id)
);

create index assignment_accreditors_profile_idx
  on public.assignment_accreditors (profile_id);

-- Schema only this pass, per decision 15 — no screen yet.
create table public.extension_requests (
  id                uuid primary key default uuid_generate_v4(),
  assignment_id     uuid not null references public.assignments (id) on delete cascade,
  requested_by      uuid references public.profiles (id) on delete set null,
  original_due_date date,
  proposed_due_date date not null,
  reason            text not null,
  status            public.extension_status not null default 'pending',
  processed_by      uuid references public.profiles (id) on delete set null,
  processed_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- ------------------------------------------------------------ evaluations

create table public.evaluations (
  id                uuid primary key default uuid_generate_v4(),
  assignment_id     uuid not null unique references public.assignments (id) on delete cascade,
  score             numeric(5,2),

  -- An explicit enum, not free text. A demotion is driven off this, and
  -- `compliance_status` prose cannot safely decide whether a programme loses a
  -- level (§2.7).
  outcome           public.evaluation_outcome,
  compliance_status text,
  remarks           text,

  ready_for_sv_at   timestamptz,
  evaluated_at      timestamptz,

  -- Release is a distinct act from evaluation — the UI already shows Score as
  -- "Not yet released" — and it is where an award is written (§2.7 assumption 5).
  released_at       timestamptz,
  released_by       uuid references public.profiles (id) on delete set null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint evaluations_score_range check (score is null or (score >= 0 and score <= 100))
);

create table public.evaluation_items (
  id                     uuid primary key default uuid_generate_v4(),
  evaluation_id          uuid not null references public.evaluations (id) on delete cascade,
  kind                   public.evaluation_item_kind not null,

  -- The sheet opens the PDF it is judging. This FK is why there is no
  -- review_status column on submission_documents: a document's status is this
  -- join, not a duplicate column that would drift (§2.3).
  submission_document_id uuid references public.submission_documents (id) on delete set null,
  requirement_area_id    uuid references public.requirement_areas (id) on delete restrict,

  label                  text not null,
  decision               public.item_decision not null default 'pending',
  score                  numeric(5,2),
  note                   text,

  -- Decision 10 puts the whole team on one sheet, so two accreditors deciding the
  -- same item is last-write-wins. Accepted deliberately: these two columns make it
  -- visible after the fact, and per-item granularity keeps the blast radius to one
  -- row rather than the whole sheet.
  decided_by             uuid references public.profiles (id) on delete set null,
  decided_at             timestamptz,

  created_at             timestamptz not null default now()
);

create index evaluation_items_evaluation_idx on public.evaluation_items (evaluation_id);

-- ---------------------------------------------------------------- awards
--
-- What a programme *holds*, as opposed to work in flight. §2.7.

alter table public.accreditation_levels
  add column if not exists validity_years_note text;

create table public.program_accreditations (
  id                    uuid primary key default uuid_generate_v4(),
  program_id            uuid not null references public.programs (id) on delete cascade,
  level_id              uuid not null references public.accreditation_levels (id) on delete restrict,
  cycle_id              uuid references public.accreditation_cycles (id) on delete set null,
  source_evaluation_id  uuid references public.evaluations (id) on delete set null,

  granted_on            date not null,
  -- Null means the award never lapses. Only Level IV has a validity period
  -- (decision 19 / O-9 closed).
  valid_until           date,

  status                public.award_status not null default 'active',
  superseded_by         uuid references public.program_accreditations (id) on delete set null,
  demoted_from_level_id uuid references public.accreditation_levels (id) on delete set null,

  decided_by            uuid references public.profiles (id) on delete set null,
  decided_at            timestamptz not null default now()
);

create index program_accreditations_program_idx on public.program_accreditations (program_id);

-- `expired` is **never written by a job**. It is computed here, so the answer
-- cannot be stale and cannot depend on a cron that failed overnight. The only
-- scheduled work is the notification in B8, and a missed run makes that late
-- rather than making this wrong (§2.7).
create or replace view public.program_awards
with (security_invoker = true) as
select
  pa.*,
  case
    when pa.status <> 'active' then pa.status::text
    when pa.valid_until is not null and pa.valid_until < current_date then 'expired'
    else 'active'
  end as effective_status
from public.program_accreditations pa;

/** The highest-ordinal award a programme still actually holds. What the public
 *  accreditation page, the QAC KPI tiles and the COPC chart all read. */
create or replace view public.current_program_level
with (security_invoker = true) as
select distinct on (a.program_id)
  a.program_id,
  a.level_id,
  l.code  as level_code,
  l.name  as level_name,
  l.ordinal,
  a.granted_on,
  a.valid_until
from public.program_awards a
join public.accreditation_levels l on l.id = a.level_id
where a.effective_status = 'active'
order by a.program_id, l.ordinal desc, a.granted_on desc;

-- --------------------------------------------------- the four transitions
--
-- Applied on **release**, not on evaluation: the UI already treats release as a
-- separate act ("Not yet released"), and it is the natural place to write an
-- award (§2.7 assumption 5).

create or replace function public.apply_award_on_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub          record;
  lvl          record;
  lower_level  record;
begin
  -- Only act the moment a release actually happens.
  if new.released_at is null or old.released_at is not null then
    return new;
  end if;

  select s.*
    into sub
    from public.submissions s
    join public.assignments a on a.submission_id = s.id
   where a.id = new.assignment_id;

  if not found then
    return new;
  end if;

  select * into lvl from public.accreditation_levels where id = sub.level_id;

  if new.outcome = 'passed' then
    -- Any prior award at the same level is superseded, not deleted.
    update public.program_accreditations
       set status = 'superseded'
     where program_id = sub.program_id
       and level_id   = sub.level_id
       and status     = 'active';

    insert into public.program_accreditations (
      program_id, level_id, cycle_id, source_evaluation_id,
      granted_on, valid_until, status, decided_by
    )
    values (
      sub.program_id,
      sub.level_id,
      sub.cycle_id,
      new.id,
      current_date,
      case
        when lvl.validity_years is null then null
        else current_date + (lvl.validity_years || ' years')::interval
      end::date,
      'active',
      new.released_by
    );

  elsif new.outcome = 'failed' and sub.is_revalidation then
    -- Failing revalidation of a level the programme *holds* costs it that level.
    -- Failing a first attempt at a level it does not hold costs nothing, which is
    -- the whole reason submissions carry is_revalidation.
    update public.program_accreditations
       set status = 'revoked'
     where program_id = sub.program_id
       and level_id   = sub.level_id
       and status     = 'active';

    -- Assumption 1 (§2.7): demotion is exactly one level down, the literal
    -- reading of "Level IV → Level III". Open item O-10 — if it should instead
    -- fall to the highest still-unexpired award, this is the query that changes.
    select * into lower_level
      from public.accreditation_levels
     where ordinal = lvl.ordinal - 1;

    if found then
      insert into public.program_accreditations (
        program_id, level_id, cycle_id, source_evaluation_id,
        granted_on, valid_until, status, demoted_from_level_id, decided_by
      )
      values (
        sub.program_id,
        lower_level.id,
        sub.cycle_id,
        new.id,
        current_date,   -- assumption 4: demotion restarts the clock at this level
        case
          when lower_level.validity_years is null then null
          else current_date + (lower_level.validity_years || ' years')::interval
        end::date,
        'active',
        lvl.id,
        new.released_by
      );
    end if;
  end if;

  -- A failed first attempt falls through deliberately: no award changes hands.
  return new;
end;
$$;

create trigger apply_award_on_release
  after update on public.evaluations
  for each row execute function public.apply_award_on_release();

-- --------------------------------------------------------------------- RLS

alter table public.assignments             enable row level security;
alter table public.assignment_accreditors  enable row level security;
alter table public.extension_requests      enable row level security;
alter table public.evaluations             enable row level security;
alter table public.evaluation_items        enable row level security;
alter table public.program_accreditations  enable row level security;

/** Assignments an accreditor is actually on. Used by several policies, so the
 *  definition of "mine" lives in one place. */
create or replace function public.my_assignment_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select aa.assignment_id
    from public.assignment_accreditors aa
    join public.profiles p on p.id = aa.profile_id
   where aa.profile_id = auth.uid()
     and p.is_active
$$;

create policy "accreditors read their own assignments"
  on public.assignments for select to authenticated
  using (id in (select public.my_assignment_ids()));

create policy "qac reads all assignments"
  on public.assignments for select to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- A representative sees that their submission is being evaluated, without seeing
-- the sheet.
create policy "reps read assignments on their submissions"
  on public.assignments for select to authenticated
  using (
    submission_id in (
      select id from public.submissions
       where program_id in (select public.my_program_ids())
    )
  );

create policy "qac creates assignments"
  on public.assignments for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac updates assignments"
  on public.assignments for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "accreditors advance their own assignments"
  on public.assignments for update to authenticated
  using (id in (select public.my_assignment_ids()))
  with check (id in (select public.my_assignment_ids()));

create policy "team membership is visible to the team and qac"
  on public.assignment_accreditors for select to authenticated
  using (
    assignment_id in (select public.my_assignment_ids())
    or public.auth_role() in ('qac_personnel', 'qac_admin')
  );

create policy "qac builds the team"
  on public.assignment_accreditors for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- An accreditor may answer only their own invitation. `profile_id = auth.uid()`
-- in both USING and WITH CHECK is what stops one team member accepting on
-- another's behalf.
create policy "accreditors answer their own invitation"
  on public.assignment_accreditors for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "qac removes accreditors from a team"
  on public.assignment_accreditors for delete to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "extension requests visible to their assignment"
  on public.extension_requests for select to authenticated
  using (
    assignment_id in (select public.my_assignment_ids())
    or public.auth_role() in ('qac_personnel', 'qac_admin')
  );

create policy "accreditors request extensions"
  on public.extension_requests for insert to authenticated
  with check (assignment_id in (select public.my_assignment_ids()));

create policy "qac processes extensions"
  on public.extension_requests for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- The shared sheet: the whole assigned team may read and write it (decision 10).
create policy "team reads the evaluation"
  on public.evaluations for select to authenticated
  using (
    assignment_id in (select public.my_assignment_ids())
    or public.auth_role() in ('qac_personnel', 'qac_admin')
  );

-- A representative sees a score only once it is **released**. Before that the
-- screen says "Not yet released", and this is what makes that true rather than
-- merely displayed.
create policy "reps read released evaluations"
  on public.evaluations for select to authenticated
  using (
    released_at is not null
    and assignment_id in (
      select a.id from public.assignments a
       join public.submissions s on s.id = a.submission_id
      where s.program_id in (select public.my_program_ids())
    )
  );

create policy "team creates the evaluation"
  on public.evaluations for insert to authenticated
  with check (assignment_id in (select public.my_assignment_ids()));

create policy "team fills the evaluation"
  on public.evaluations for update to authenticated
  using (assignment_id in (select public.my_assignment_ids()) and released_at is null)
  with check (assignment_id in (select public.my_assignment_ids()));

-- Release is QAC's act, not the team's.
create policy "qac releases evaluations"
  on public.evaluations for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "team reads sheet items"
  on public.evaluation_items for select to authenticated
  using (
    evaluation_id in (
      select id from public.evaluations
       where assignment_id in (select public.my_assignment_ids())
    )
    or public.auth_role() in ('qac_personnel', 'qac_admin')
  );

create policy "team writes sheet items"
  on public.evaluation_items for insert to authenticated
  with check (
    evaluation_id in (
      select id from public.evaluations
       where assignment_id in (select public.my_assignment_ids())
    )
  );

create policy "team decides sheet items"
  on public.evaluation_items for update to authenticated
  using (
    evaluation_id in (
      select id from public.evaluations
       where assignment_id in (select public.my_assignment_ids())
    )
  )
  with check (
    evaluation_id in (
      select id from public.evaluations
       where assignment_id in (select public.my_assignment_ids())
    )
  );

-- Awards are public standing inside the portal: everyone signed in can read them,
-- and only the release trigger writes them.
create policy "awards are readable by authenticated users"
  on public.program_accreditations for select to authenticated
  using (public.is_active_user());
