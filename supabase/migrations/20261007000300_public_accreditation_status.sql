-- Live counts for the public Accreditations page. Anonymous visitors cannot read programs or
-- awards, so the page reads this aggregate (counts only, no rows) instead of the tables.
-- A program counts once, at the highest level it currently holds: an active award, or else a
-- valid AACCUP certificate on file (the same fallback the QAC overview uses).

create or replace function public.public_accreditation_status()
returns table (level_code text, programs int)
language sql
stable
security definer
set search_path = public
as $$
  with awarded as (
    select c.program_id, c.level_code, c.ordinal
      from public.current_program_level c
      join public.programs p on p.id = c.program_id and p.deleted_at is null
  ),
  certified as (
    select distinct on (f.program_id) f.program_id, l.code as level_code, l.ordinal
      from public.repository_files f
      join public.repository_folders rf on rf.id = f.folder_id and rf.slug = 'aaccup-certificate'
      join public.programs p on p.id = f.program_id and p.deleted_at is null
      join public.accreditation_levels l on l.id = f.level_id
     where not f.is_archived
       and f.valid_until is not null
       and f.valid_until >= current_date
       and f.program_id not in (select program_id from awarded)
     order by f.program_id, l.ordinal desc, f.valid_until desc
  )
  select x.level_code, count(*)::int
    from (select * from awarded union all select * from certified) x
   group by x.level_code;
$$;

revoke all on function public.public_accreditation_status() from public;
grant execute on function public.public_accreditation_status() to anon, authenticated;
