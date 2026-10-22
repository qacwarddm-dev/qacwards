-- The accreditation progress % has a stage "Team Leader's overall report acknowledged
-- by QAC". QAC can read accreditor_reports; a program rep cannot, so their percentage
-- could never reach that stage and disagreed with the one QAC sees for the same
-- program. This hands back one boolean per submission, nothing else from the report.
create or replace function public.submission_report_acknowledged(p_submissions uuid[])
returns table (submission_id uuid, acknowledged boolean)
language sql
stable
security definer
set search_path = public
as $$
  select s.id,
         exists (
           select 1
             from public.assignments a
             join public.assignment_accreditors aa
               on aa.assignment_id = a.id and aa.is_team_leader and aa.response <> 'rejected'
             join public.accreditor_reports r
               on r.assignment_id = a.id and r.accreditor_id = aa.profile_id
            where a.submission_id = s.id and r.status = 'acknowledged'
         )
    from public.submissions s
   where s.id = any (p_submissions)
     and (public.is_qac() or s.program_id in (select public.my_program_ids()));
$$;

revoke all on function public.submission_report_acknowledged(uuid[]) from public, anon;
grant execute on function public.submission_report_acknowledged(uuid[]) to authenticated;
