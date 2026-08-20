-- BUG-4 — found immediately by a live REST smoke test of the previous
-- migration, not by reasoning about the schema. Every read of `submissions` or
-- `assignments` for a signed-in user started failing:
--
--   {"code":"42P17","message":"infinite recursion detected in policy for
--   relation \"submissions\""}
--
-- Cause: `20260818001000`'s new accreditor policy on `submissions` queried
-- `public.assignments` directly. `assignments` already carries "reps read
-- assignments on their submissions", which queries `public.submissions`
-- directly right back. Both tables have RLS enabled, so evaluating either
-- policy required evaluating the other table's RLS, which required
-- evaluating the first table's RLS again — a structural cycle, not a
-- data-dependent one, so it broke every caller, not just accreditors.
--
-- Every other cross-table RLS lookup in this schema (`my_program_ids()`,
-- `my_assignment_ids()`, `is_active_user()`, `auth_role()`) is a `security
-- definer` function for exactly this reason: its body runs as the function
-- owner, bypassing RLS on the tables *it* queries, so it cannot re-enter the
-- calling table's own policy. The new policy skipped that indirection. Fixed
-- by adding the missing indirection rather than hand-inlining the query.

create or replace function public.my_assigned_submission_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.submission_id
    from public.assignments a
   where a.id in (select public.my_assignment_ids())
$$;

comment on function public.my_assigned_submission_ids() is
  'Submissions the signed-in accreditor is on the team for. security definer '
  'so the read of `assignments` inside it bypasses RLS — used from a policy '
  'on `submissions`, and `assignments`'' own RLS reads `submissions` right '
  'back, so a direct (non-definer) query here would recurse (BUG-4).';

drop policy "accreditors read submissions on their assignments" on public.submissions;

create policy "accreditors read submissions on their assignments"
  on public.submissions for select to authenticated
  using (id in (select public.my_assigned_submission_ids()));
