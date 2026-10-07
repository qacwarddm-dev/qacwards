-- Client feedback: a program added by the admin showed "no rep" and never appeared in
-- the college's Accreditation list. Reps see programs through program_reps, and a new
-- program had none. Same audience as notify_program_added: reps on that campus and,
-- when the program has a college, in that college.

create or replace function public.assign_program_reps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null then
    return null;
  end if;

  insert into public.program_reps (profile_id, program_id)
  select id, new.id from public.profiles
   where role = 'program_representative'
     and is_active
     and deleted_at is null
     and campus_id = new.campus_id
     and (new.college_id is null or college_id = new.college_id)
  on conflict do nothing;

  return null;
end;
$$;

drop trigger if exists assign_program_reps on public.programs;
create trigger assign_program_reps
  after insert on public.programs
  for each row execute function public.assign_program_reps();

insert into public.program_reps (profile_id, program_id)
select pr.id, p.id
  from public.programs p
  join public.profiles pr
    on pr.role = 'program_representative'
   and pr.is_active
   and pr.deleted_at is null
   and pr.campus_id = p.campus_id
   and (p.college_id is null or pr.college_id = p.college_id)
 where p.deleted_at is null
   and p.created_at >= timestamptz '2026-10-07 13:00:00+08'
   and not exists (select 1 from public.program_reps x where x.program_id = p.id)
on conflict do nothing;
