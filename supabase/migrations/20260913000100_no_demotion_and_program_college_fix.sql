-- O-10: client's call — a program that fails revalidation stays at its current
-- level, it does not drop a level. Removes the demotion insert entirely; the
-- revoke of the held level's active award still happens (the level is no
-- longer valid), but nothing replaces it.
create or replace function public.apply_award_on_release()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub          record;
  lvl          record;
begin
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
    -- O-10 (closed 2026-09-06): no demotion. The program simply stays at its
    -- current level; failing revalidation revokes the award being
    -- revalidated but nothing is inserted to replace it.
    update public.program_accreditations
       set status = 'revoked'
     where program_id = sub.program_id
       and level_id   = sub.level_id
       and status     = 'active';
  end if;

  -- A failed first attempt falls through deliberately: no award changes hands.
  return new;
end;
$$;

-- O-18b: "Master of Arts in Physical Education and Sports" belongs under the
-- College of Human Kinetics (CHK), not COED. Client-confirmed 2026-09-06.
update public.programs
   set college_id = (select id from public.colleges where code = 'CHK')
 where name = 'Master of Arts in Physical Education and Sports'
   and college_id = (select id from public.colleges where code = 'COED');
