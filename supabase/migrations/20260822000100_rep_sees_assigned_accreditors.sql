-- The Program Representative dashboard's "On-Going Program Accreditation"
-- table carries an Assigned Accreditor column (Figma frame 01-Dashboard.png),
-- but representatives saw it blank. Two RLS gaps, found by wiring against the
-- live database rather than on paper — the same failure shape
-- 20260818001000_dashboard_visibility.sql fixed for submissions:
--
-- 1. `assignment_accreditors` read access went to the team itself and QAC.
--    A representative is neither, so the embedded team rows came back empty
--    for the one person the column exists to inform.
-- 2. Even with the row readable, the embed joins `profiles(surname,
--    given_name)`, and profiles' SELECT policies covered only the caller's
--    own row plus QAC — so the name would have been null anyway. The same
--    hole blanks teammate names on the accreditor's own evaluation screens,
--    which is why the second policy below also covers teammates.
--
-- Both policies key off the established definer predicates
-- (`my_program_ids()` / `my_assignment_ids()`), which run as their owner and
-- so cannot recurse through the very policies being defined here.

create policy "reps read the team on their programmes' assignments"
  on public.assignment_accreditors for select to authenticated
  using (
    assignment_id in (
      select a.id
        from public.assignments a
        join public.submissions s on s.id = a.submission_id
       where s.program_id in (select public.my_program_ids())
    )
  );

-- Row-level, not column-level: anyone who may see a team roster may read the
-- whole profile row of its members (name, role, webmail). Deliberately
-- narrower than "everyone": only accreditators serving on the caller's own
-- assignments, and accreditors serving on the caller's represented
-- programmes'.
create policy "assignment participants read each other's profiles"
  on public.profiles for select to authenticated
  using (
    id in (
      select aa.profile_id
        from public.assignment_accreditors aa
       where aa.assignment_id in (select public.my_assignment_ids())
    )
    or id in (
      select aa.profile_id
        from public.assignment_accreditors aa
        join public.assignments a on a.id = aa.assignment_id
        join public.submissions s on s.id = a.submission_id
       where s.program_id in (select public.my_program_ids())
    )
  );
