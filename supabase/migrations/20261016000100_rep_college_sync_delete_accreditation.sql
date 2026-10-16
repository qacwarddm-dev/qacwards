-- Client feedback: a CCIS faculty who registered saw none of the college's programs.
-- Reps see programs through program_reps, and assign_program_reps only ran when a
-- program was added, so every rep who registered after the programs existed had no
-- rows. Link a rep to every program on their campus (and college, when the program
-- has one) the moment the profile is created or moved, regardless of position.

create or replace function public.link_rep_to_programs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> 'program_representative'
     or not new.is_active
     or new.deleted_at is not null
     or new.campus_id is null then
    return null;
  end if;

  insert into public.program_reps (profile_id, program_id)
  select new.id, p.id from public.programs p
   where p.deleted_at is null
     and p.campus_id = new.campus_id
     and (p.college_id is null or p.college_id = new.college_id)
  on conflict do nothing;

  return null;
end;
$$;

drop trigger if exists link_rep_to_programs on public.profiles;
create trigger link_rep_to_programs
  after insert or update of role, campus_id, college_id, is_active, deleted_at on public.profiles
  for each row execute function public.link_rep_to_programs();

insert into public.program_reps (profile_id, program_id)
select pr.id, p.id
  from public.profiles pr
  join public.programs p
    on p.campus_id = pr.campus_id
   and (p.college_id is null or p.college_id = pr.college_id)
 where pr.role = 'program_representative'
   and pr.is_active
   and pr.deleted_at is null
   and pr.campus_id is not null
   and p.deleted_at is null
on conflict do nothing;

-- Client feedback: QAC needs to delete an accreditation from the Accreditation list.
-- Submissions and assignments have no delete policy, so this is the only way in.
-- Everything under the submission (assignment, team, evaluation, documents) goes with
-- it through the existing ON DELETE CASCADE foreign keys.

create or replace function public.delete_accreditation(p_submission uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_qac() then
    raise exception 'Only QAC can delete an accreditation.' using errcode = 'insufficient_privilege';
  end if;

  delete from public.submissions where id = p_submission;
end;
$$;

revoke all on function public.delete_accreditation(uuid) from public;
grant execute on function public.delete_accreditation(uuid) to authenticated;
