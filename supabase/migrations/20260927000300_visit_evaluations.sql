-- Post-visit evaluations a Program Representative answers once a visit is
-- complete (client mockup program-rep-navigation-mockup_5.html, 2026-09-27):
-- one QAC Service Evaluation per visit, plus one Internal Accreditor
-- Evaluation per accreditor who visited. Replaces the Google Forms.
--
-- A row exists from the first autosave; `submitted_at` null is a draft.

create table if not exists public.visit_evaluations (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  evaluator_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind          text not null,
  accreditor_id uuid references public.profiles (id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  submitted_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint visit_evaluations_kind_check
    check (kind in ('qac_service', 'internal_accreditor')),
  constraint visit_evaluations_target_check
    check ((kind = 'internal_accreditor') = (accreditor_id is not null)),
  constraint visit_evaluations_one_per_target
    unique nulls not distinct (assignment_id, evaluator_id, kind, accreditor_id)
);

create index if not exists visit_evaluations_evaluator_idx
  on public.visit_evaluations (evaluator_id);

alter table public.visit_evaluations enable row level security;

drop policy if exists "evaluators and QAC read visit evaluations" on public.visit_evaluations;
create policy "evaluators and QAC read visit evaluations"
  on public.visit_evaluations for select to authenticated
  using (
    evaluator_id = auth.uid()
    or public.auth_role() in ('qac_personnel', 'qac_admin')
  );

drop policy if exists "reps start evaluations for their programmes' visits" on public.visit_evaluations;
create policy "reps start evaluations for their programmes' visits"
  on public.visit_evaluations for insert to authenticated
  with check (
    evaluator_id = auth.uid()
    and public.auth_role() = 'program_representative'
    and assignment_id in (
      select a.id
        from public.assignments a
        join public.submissions s on s.id = a.submission_id
       where s.program_id in (select public.my_program_ids())
         and a.status in ('evaluated', 'score_returned')
    )
  );

-- A submitted evaluation is final: the USING clause reads the row as stored,
-- so once submitted_at is set no further update matches.
drop policy if exists "reps edit their own drafts" on public.visit_evaluations;
create policy "reps edit their own drafts"
  on public.visit_evaluations for update to authenticated
  using (evaluator_id = auth.uid() and submitted_at is null)
  with check (evaluator_id = auth.uid());

-- Audited on submit only: every autosave is an UPDATE, and logging drafts
-- would bury the one row /portal/activity shows ("Answered the ... Evaluation").
drop trigger if exists log_activity_submitted on public.visit_evaluations;
create trigger log_activity_submitted
  after insert on public.visit_evaluations
  for each row when (new.submitted_at is not null)
  execute function public.log_activity();

drop trigger if exists log_activity_submitted_update on public.visit_evaluations;
create trigger log_activity_submitted_update
  after update on public.visit_evaluations
  for each row when (old.submitted_at is null and new.submitted_at is not null)
  execute function public.log_activity();
