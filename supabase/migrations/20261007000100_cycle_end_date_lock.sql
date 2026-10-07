-- A cycle stops taking work when its closing date passes, not only when QAC
-- presses Close. Until now every rep write policy checked `status = 'open'`, so a
-- cycle that ran past its end date kept accepting uploads and submissions until
-- an admin remembered to close it.

create or replace function public.cycle_accepts_work(p_cycle uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.accreditation_cycles c
     where c.id = p_cycle
       and c.status = 'open'
       and c.end_date >= (now() at time zone 'Asia/Manila')::date
  );
$$;

revoke all on function public.cycle_accepts_work(uuid) from public;
grant execute on function public.cycle_accepts_work(uuid) to authenticated;

drop policy if exists "reps create submissions in an open cycle" on public.submissions;
create policy "reps create submissions in an open cycle"
  on public.submissions for insert to authenticated
  with check (
    program_id in (select public.my_program_ids())
    and public.cycle_accepts_work(cycle_id)
  );

drop policy if exists "reps update own unsubmitted submissions" on public.submissions;
create policy "reps update own unsubmitted submissions"
  on public.submissions for update to authenticated
  using (
    program_id in (select public.my_program_ids())
    and status in ('not_started', 'in_progress', 'returned')
    and public.cycle_accepts_work(cycle_id)
  )
  with check (program_id in (select public.my_program_ids()));

drop policy if exists "reps upload to their own open submissions" on public.submission_documents;
create policy "reps upload to their own open submissions"
  on public.submission_documents for insert to authenticated
  with check (
    exists (
      select 1
        from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress', 'returned', 'submitted', 'under_evaluation')
         and public.cycle_accepts_work(s.cycle_id)
    )
  );

-- Superseding a file flips is_current on the old row, and "continue draft"
-- promotes a draft; both are updates, so they need the same cycle guard.
drop policy if exists "reps supersede their own documents" on public.submission_documents;
create policy "reps supersede their own documents"
  on public.submission_documents for update to authenticated
  using (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and public.cycle_accepts_work(s.cycle_id)
    )
  )
  with check (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and public.cycle_accepts_work(s.cycle_id)
    )
  );

drop policy if exists "reps set their own level III choices" on public.submission_choices;
create policy "reps set their own level III choices"
  on public.submission_choices for insert to authenticated
  with check (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
         and public.cycle_accepts_work(s.cycle_id)
    )
  );

drop policy if exists "reps clear their own level III choices" on public.submission_choices;
create policy "reps clear their own level III choices"
  on public.submission_choices for delete to authenticated
  using (
    exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress')
         and public.cycle_accepts_work(s.cycle_id)
    )
  );
