create or replace function public.archive_detail(p_assignment uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select public.is_qac() or exists (
    select 1
      from public.assignments a
      join public.submissions s on s.id = a.submission_id
      join public.evaluations e on e.assignment_id = a.id
     where a.id = p_assignment
       and e.released_at is not null
       and s.program_id in (select public.my_program_ids())
  ) into v_ok;

  if not coalesce(v_ok, false) then
    return null;
  end if;

  return jsonb_build_object(
    'reports', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', p.surname || ', ' || p.given_name,
               'grandMean', r.grand_mean,
               'findings', r.overall_findings,
               'recommendation', r.recommendation,
               'reviewedAt', r.reviewed_at
             ) order by p.surname), '[]'::jsonb)
        from public.accreditor_reports r
        join public.profiles p on p.id = r.accreditor_id
       where r.assignment_id = p_assignment
         and r.status = 'acknowledged'
    ),
    'ratings', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'areaId', ra.id,
               'name', ra.name,
               'mean', m.mean
             ) order by ra.ordinal), '[]'::jsonb)
        from (
          select requirement_area_id, round(avg(rating), 2) as mean
            from public.area_ratings
           where assignment_id = p_assignment and rating is not null
           group by requirement_area_id
        ) m
        join public.requirement_areas ra on ra.id = m.requirement_area_id
    )
  );
end;
$$;

revoke all on function public.archive_detail(uuid) from public;
grant execute on function public.archive_detail(uuid) to authenticated;
