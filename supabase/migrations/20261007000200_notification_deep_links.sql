-- Notification links that landed on the wrong page: QAC's "Submission filed" pointed at the
-- rep-only /portal/submission (redirects to the dashboard), upload alerts at a dashboard query
-- nothing reads, and the accreditor's "Resubmitted" at /portal/evaluation/<id>, which has no route.

create or replace function public.notify_submission_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program text;
  v_level   text;
  v_staff   record;
begin
  if old.submitted_at is not null or new.submitted_at is null then
    return null;
  end if;

  select p.name, l.name into v_program, v_level
  from public.programs p, public.accreditation_levels l
  where p.id = new.program_id and l.id = new.level_id;

  for v_staff in
    select id from public.profiles
    where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_staff.id,
      'submission_received',
      'Submission filed: ' || coalesce(v_program, 'a programme'),
      coalesce(v_level, '') || ' · attempt ' || new.attempt,
      '/portal/assignment?sub=' || new.id,
      auth.uid(),
      true
    );
  end loop;

  return null;
end;
$$;

create or replace function public.notify_document_uploaded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  v_program    text;
  v_level      text;
  v_title      text;
  v_body       text;
  v_link       text;
  v_who        record;
begin
  select s.program_id, p.name, l.name into v_program_id, v_program, v_level
    from public.submissions s
    join public.programs p on p.id = s.program_id
    join public.accreditation_levels l on l.id = s.level_id
   where s.id = new.submission_id;

  v_title := 'New upload: ' || new.title;
  v_body  := coalesce(v_program, 'a programme') || ' · ' || coalesce(v_level, '');
  v_link  := case
    when new.phase_document_id is not null then '/portal/extension-monitoring?p=' || v_program_id
    else '/portal/assignment?id=' || v_program_id || '&stage=req'
  end;

  for v_who in
    select id from public.profiles
     where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_who.id, 'document_uploaded', v_title, v_body, v_link,
      new.uploaded_by, false
    );
  end loop;

  for v_who in
    select distinct aa.profile_id as id, a.id as assignment_id
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.submission_id = new.submission_id
       and aa.response <> 'rejected'
  loop
    perform public.notify_user(
      v_who.id, 'document_uploaded', v_title, v_body, '/portal/evaluation?a=' || v_who.assignment_id,
      new.uploaded_by, false
    );
  end loop;

  return null;
end;
$$;

create or replace function public.notify_submission_resubmitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program text;
  v_who     record;
begin
  if old.status <> 'returned' or new.status <> 'under_evaluation' then
    return null;
  end if;

  select name into v_program from public.programs where id = new.program_id;

  for v_who in
    select aa.profile_id as id, a.id as assignment_id
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.submission_id = new.id
       and aa.response = 'accepted'
  loop
    perform public.notify_user(
      v_who.id,
      'submission_received',
      'Resubmitted: ' || coalesce(v_program, 'a programme'),
      'The programme addressed your return note.',
      '/portal/evaluation?a=' || v_who.assignment_id,
      auth.uid(),
      true
    );
  end loop;

  return null;
end;
$$;
