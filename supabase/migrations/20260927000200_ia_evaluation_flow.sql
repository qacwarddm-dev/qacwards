-- Internal Accreditor evaluation flow (docs/internal_accreditor.pdf, 2026-09-27).

-- -------------------------------------------------------- site visit date

alter table public.assignments
  add column if not exists site_visit_date date;

comment on column public.assignments.site_visit_date is
  'The simulation / site visit day QAC schedules. The Evaluate button unlocks on '
  'this date (Asia/Manila) and stays unlocked after it. Distinct from due_date, '
  'which is the document-review deadline.';

-- ------------------------------------------------------------- return note

create table if not exists public.submission_returns (
  id            uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  assignment_id uuid references public.assignments (id) on delete set null,
  note          text not null,
  returned_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  constraint submission_returns_note_check check (length(btrim(note)) > 0)
);

create index if not exists submission_returns_submission_idx
  on public.submission_returns (submission_id, created_at desc);

alter table public.submission_returns enable row level security;

drop policy if exists "returns follow their submission" on public.submission_returns;
create policy "returns follow their submission"
  on public.submission_returns for select to authenticated
  using (submission_id in (select id from public.submissions));

-- Accreditors have no UPDATE on submissions and should not get one: the only
-- write they may make is this one transition, so it is a definer function
-- that checks membership itself.
create or replace function public.return_submission(p_assignment uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment record;
  v_program    text;
  v_rep        record;
begin
  if coalesce(btrim(p_note), '') = '' then
    raise exception 'Give a reason for returning.' using errcode = 'check_violation';
  end if;

  if not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = p_assignment
       and profile_id = auth.uid()
       and response = 'accepted'
  ) then
    raise exception 'Only an accreditor on this assignment may return it.'
      using errcode = 'insufficient_privilege';
  end if;

  select a.id, a.status, s.id as submission_id, s.status as submission_status, s.program_id
    into v_assignment
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
   where a.id = p_assignment;

  if v_assignment.status <> 'in_progress' or v_assignment.submission_status <> 'under_evaluation' then
    raise exception 'This submission can no longer be returned.' using errcode = 'check_violation';
  end if;

  update public.submissions set status = 'returned' where id = v_assignment.submission_id;

  insert into public.submission_returns (submission_id, assignment_id, note, returned_by)
  values (v_assignment.submission_id, p_assignment, btrim(p_note), auth.uid());

  select name into v_program from public.programs where id = v_assignment.program_id;

  for v_rep in
    select profile_id from public.program_reps where program_id = v_assignment.program_id
  loop
    perform public.notify_user(
      v_rep.profile_id,
      'document_disapproved',
      'Submission returned: ' || coalesce(v_program, 'your programme'),
      btrim(p_note),
      '/portal/submission',
      auth.uid(),
      true
    );
  end loop;
end;
$$;

revoke all on function public.return_submission(uuid, text) from public;
grant execute on function public.return_submission(uuid, text) to authenticated;

-- A returned submission that already has an assignment goes straight back to
-- that team instead of through QAC again (assignments.submission_id is UNIQUE,
-- so a second assignment is impossible anyway).
create or replace function public.notify_submission_resubmitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program text;
  v_who     record;
begin
  if old.status <> 'returned' or new.status <> 'under_evaluation' then
    return null;
  end if;

  select name into v_program from public.programs where id = new.program_id;

  for v_who in
    select aa.profile_id as id, a.id as assignment_id
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.submission_id = new.id
       and aa.response = 'accepted'
  loop
    perform public.notify_user(
      v_who.id,
      'submission_received',
      'Resubmitted: ' || coalesce(v_program, 'a programme'),
      'The programme addressed your return note.',
      '/portal/evaluation/' || v_who.assignment_id,
      auth.uid(),
      true
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists notify_submission_resubmitted on public.submissions;
create trigger notify_submission_resubmitted
  after update on public.submissions
  for each row execute function public.notify_submission_resubmitted();

-- ------------------------------------------------------ the shared sheet

alter table public.evaluations
  add column if not exists sheet jsonb not null default '{}'::jsonb,
  add column if not exists sheet_updated_at timestamptz,
  add column if not exists sheet_updated_by uuid references public.profiles (id) on delete set null;

comment on column public.evaluations.sheet is
  'The IA Evaluation Sheet answers (QAC FORM NO.005), keyed by field. Both '
  'accreditors autosave into it through patch_evaluation_sheet, which merges '
  'key-by-key so one accreditor typing in Area 1 never overwrites the other in Area 2.';

-- Invoker, not definer: the "team fills the evaluation" policy already says
-- who may write and that a released sheet is frozen. `||` makes the merge
-- atomic, which a read-modify-write through PostgREST cannot be.
create or replace function public.patch_evaluation_sheet(p_assignment uuid, p_patch jsonb)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  update public.evaluations
     set sheet = sheet || p_patch,
         sheet_updated_at = now(),
         sheet_updated_by = auth.uid()
   where assignment_id = p_assignment
     and evaluated_at is null
  returning sheet;
$$;

grant execute on function public.patch_evaluation_sheet(uuid, jsonb) to authenticated;
