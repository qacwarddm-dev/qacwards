-- Team Leader + Assistant on an accreditation assignment (client mockups,
-- 2026-10-11). QAC picks one of the two accreditors as Team Leader and splits the
-- level's areas between them. Each accreditor rates only their own areas, the
-- Assistant sends their areas to the Team Leader, and only the Team Leader signs
-- and submits the one overall evaluation report.

alter table public.assignment_accreditors
  add column if not exists is_team_leader boolean not null default false,
  add column if not exists areas_sent_at timestamptz;

alter table public.assignments
  add column if not exists leader_area_ids uuid[] not null default '{}';

comment on column public.assignments.leader_area_ids is
  'Requirement areas the Team Leader rates. Every other area of the level belongs '
  'to the Assistant, so an optional Level III area the program picks later needs no '
  'extra row.';

create unique index if not exists assignment_accreditors_one_leader
  on public.assignment_accreditors (assignment_id) where is_team_leader;

-- ------------------------------------------------------------- defaults

create or replace function public.default_leader_areas(p_level uuid)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  with lv as (
    select case code when 'III' then 'l3' when 'IV' then 'l4' else 'base' end as k
      from public.accreditation_levels where id = p_level
  ),
  picked as (
    select coalesce(
      (select s.value -> lv.k from public.site_settings s, lv where s.key = 'teamAreas'),
      (select case lv.k when 'l3' then '[0,1]'::jsonb when 'l4' then '[0,1,2]'::jsonb else '[1,2,4,5,7]'::jsonb end from lv)
    ) as j
  ),
  areas as (
    select id, row_number() over (order by ordinal) - 1 as pos
      from public.requirement_areas where level_id = p_level
  )
  select coalesce(array_agg(a.id order by a.pos), '{}')
    from areas a, picked
   where picked.j @> to_jsonb(a.pos::int)
$$;

grant execute on function public.default_leader_areas(uuid) to authenticated;

-- ------------------------------------------------------------- helpers

create or replace function public.included_areas(p_assignment uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ra.id
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
    join public.requirement_areas ra on ra.level_id = s.level_id
   where a.id = p_assignment
     and (
       not ra.is_optional
       or exists (
         select 1 from public.submission_choices c
          where c.submission_id = s.id and c.requirement_area_id = ra.id
       )
     )
$$;

-- Who rates this area. An assignment with no flagged leader keeps the old
-- behaviour (every accepted accreditor), so nothing is locked out mid-migration.
create or replace function public.owns_area(p_assignment uuid, p_area uuid, p_profile uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.assignments a
      join public.assignment_accreditors aa on aa.assignment_id = a.id
     where a.id = p_assignment
       and aa.profile_id = p_profile
       and aa.response = 'accepted'
       and (
         not exists (
           select 1 from public.assignment_accreditors l
            where l.assignment_id = a.id and l.is_team_leader
         )
         or aa.is_team_leader = (p_area = any (a.leader_area_ids))
       )
  )
$$;

-- Frozen once the overall report is signed, and for an Assistant who already
-- sent their areas to the Team Leader.
create or replace function public.area_locked(p_assignment uuid, p_profile uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.accreditor_reports r
      join public.assignment_accreditors l
        on l.assignment_id = r.assignment_id and l.profile_id = r.accreditor_id and l.is_team_leader
     where r.assignment_id = p_assignment
       and r.status in ('submitted', 'acknowledged')
  ) or exists (
    select 1 from public.assignment_accreditors aa
     where aa.assignment_id = p_assignment
       and aa.profile_id = p_profile
       and not aa.is_team_leader
       and aa.areas_sent_at is not null
  )
$$;

create or replace function public.area_is_evaluated(p_assignment uuid, p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.assignments a
      join public.submission_documents sd
        on sd.submission_id = a.submission_id
       and sd.requirement_area_id = p_area
       and sd.is_current and not sd.is_draft
     where a.id = p_assignment
       and (
         select r.decision from public.document_reviews r
          where r.submission_document_id = sd.id
          order by r.created_at desc limit 1
       ) = 'approved'
  ) and (
    select count(distinct ar.indicator)
      from public.area_ratings ar
     where ar.assignment_id = p_assignment
       and ar.requirement_area_id = p_area
       and ar.rating is not null
  ) >= 3
$$;

create or replace function public.may_review_document(p_doc uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.submission_documents sd
      left join public.assignments a on a.submission_id = sd.submission_id
     where sd.id = p_doc
       and (
         public.is_qac()
         or (
           public.accepted_on_submission(sd.submission_id)
           and (
             sd.requirement_area_id is null
             or (
               public.owns_area(a.id, sd.requirement_area_id)
               and not public.area_locked(a.id)
             )
           )
         )
       )
  )
$$;

-- ------------------------------------------------------------ triggers

create or replace function public.default_team_leader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not new.is_team_leader and not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = new.assignment_id and is_team_leader
  ) then
    new.is_team_leader := true;
  end if;
  return new;
end;
$$;

drop trigger if exists default_team_leader on public.assignment_accreditors;
create trigger default_team_leader
  before insert on public.assignment_accreditors
  for each row execute function public.default_team_leader();

create or replace function public.promote_team_leader()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_team_leader and not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = old.assignment_id and is_team_leader
  ) then
    update public.assignment_accreditors
       set is_team_leader = true
     where (assignment_id, profile_id) = (
       select assignment_id, profile_id
         from public.assignment_accreditors
        where assignment_id = old.assignment_id
        order by (response = 'rejected'), responded_at nulls last, profile_id
        limit 1
     );
  end if;
  return null;
end;
$$;

drop trigger if exists promote_team_leader on public.assignment_accreditors;
create trigger promote_team_leader
  after delete on public.assignment_accreditors
  for each row execute function public.promote_team_leader();

create or replace function public.default_assignment_areas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if cardinality(new.leader_area_ids) = 0 then
    new.leader_area_ids := public.default_leader_areas(
      (select level_id from public.submissions where id = new.submission_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists default_assignment_areas on public.assignments;
create trigger default_assignment_areas
  before insert on public.assignments
  for each row execute function public.default_assignment_areas();

-- ------------------------------------------------------------ backfill

-- Existing assignments predate the role. Whoever already signed a report keeps
-- the lead, otherwise the accreditor who accepted first, so the pick follows
-- what actually happened rather than an id.
update public.assignment_accreditors aa
   set is_team_leader = true
  from (
    select distinct on (m.assignment_id) m.assignment_id, m.profile_id
      from public.assignment_accreditors m
     order by m.assignment_id,
              (m.response = 'rejected'),
              not exists (
                select 1 from public.accreditor_reports r
                 where r.assignment_id = m.assignment_id and r.accreditor_id = m.profile_id
                   and r.status in ('submitted', 'acknowledged')
              ),
              m.responded_at nulls last,
              m.profile_id
  ) f
 where aa.assignment_id = f.assignment_id
   and aa.profile_id = f.profile_id
   and not exists (
     select 1 from public.assignment_accreditors x
      where x.assignment_id = aa.assignment_id and x.is_team_leader
   );

update public.assignments a
   set leader_area_ids = public.default_leader_areas(s.level_id)
  from public.submissions s
 where s.id = a.submission_id
   and cardinality(a.leader_area_ids) = 0;

-- --------------------------------------------------------------- RLS

drop policy if exists "accreditors write their own ratings" on public.area_ratings;
drop policy if exists "accreditors rate their own areas" on public.area_ratings;
create policy "accreditors rate their own areas"
  on public.area_ratings for all to authenticated
  using (
    accreditor_id = auth.uid()
    and public.owns_area(assignment_id, requirement_area_id)
    and not public.area_locked(assignment_id)
  )
  with check (
    accreditor_id = auth.uid()
    and public.owns_area(assignment_id, requirement_area_id)
    and not public.area_locked(assignment_id)
  );

drop policy if exists "qac and team review documents" on public.document_reviews;
create policy "qac and team review documents"
  on public.document_reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.may_review_document(submission_document_id)
  );

-- ------------------------------------------------------ team roles (QAC)

create or replace function public.set_team_roles(p_assignment uuid, p_leader uuid, p_areas uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level   uuid;
  v_total   integer;
  v_valid   integer;
  v_members integer;
  v_old     uuid;
  v_old_ids uuid[];
begin
  if not public.is_qac() then
    raise exception 'Only QAC can set the Team Leader.' using errcode = 'insufficient_privilege';
  end if;

  select s.level_id into v_level
    from public.assignments a join public.submissions s on s.id = a.submission_id
   where a.id = p_assignment;
  if v_level is null then
    raise exception 'That assignment no longer exists.' using errcode = 'no_data_found';
  end if;

  if not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = p_assignment and profile_id = p_leader and response <> 'rejected'
  ) then
    raise exception 'The Team Leader must be one of the assigned accreditors.' using errcode = 'check_violation';
  end if;

  select count(*) into v_total from public.requirement_areas where level_id = v_level;
  select count(*) into v_valid from public.requirement_areas where level_id = v_level and id = any (p_areas);
  if v_valid <> cardinality(p_areas) then
    raise exception 'Those areas do not belong to this level.' using errcode = 'check_violation';
  end if;

  select count(*) into v_members from public.assignment_accreditors
   where assignment_id = p_assignment and response <> 'rejected';
  if v_members >= 2 and (cardinality(p_areas) < 1 or cardinality(p_areas) >= v_total) then
    raise exception 'Each accreditor needs at least one area.' using errcode = 'check_violation';
  end if;

  select profile_id into v_old from public.assignment_accreditors where assignment_id = p_assignment and is_team_leader;
  select leader_area_ids into v_old_ids from public.assignments where id = p_assignment;

  update public.assignment_accreditors set is_team_leader = false where assignment_id = p_assignment and is_team_leader;
  update public.assignment_accreditors
     set is_team_leader = true
   where assignment_id = p_assignment and profile_id = p_leader;
  update public.assignments set leader_area_ids = p_areas where id = p_assignment;

  -- Re-saving the same split (a date change on the assignment form) must not
  -- take back areas the Assistant already sent.
  if v_old is distinct from p_leader or not (v_old_ids @> p_areas and p_areas @> v_old_ids) then
    update public.assignment_accreditors set areas_sent_at = null where assignment_id = p_assignment and areas_sent_at is not null;
  end if;
end;
$$;

revoke all on function public.set_team_roles(uuid, uuid, uuid[]) from public;
grant execute on function public.set_team_roles(uuid, uuid, uuid[]) to authenticated;

-- ---------------------------------------- Assistant -> Team Leader hand-off

create or replace function public.send_areas_to_leader(p_assignment uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me      public.assignment_accreditors;
  v_leader  uuid;
  v_program text;
  v_area    uuid;
begin
  select * into v_me from public.assignment_accreditors
   where assignment_id = p_assignment and profile_id = auth.uid() and response = 'accepted';
  if not found then
    raise exception 'Only an accreditor on this assignment may send areas.' using errcode = 'insufficient_privilege';
  end if;
  if v_me.is_team_leader then
    raise exception 'The Team Leader generates the overall report instead.' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.accreditor_reports r
     where r.assignment_id = p_assignment and r.status in ('submitted', 'acknowledged')
  ) then
    raise exception 'The overall report is already signed.' using errcode = 'check_violation';
  end if;

  for v_area in select public.included_areas(p_assignment) loop
    if public.owns_area(p_assignment, v_area) and not public.area_is_evaluated(p_assignment, v_area) then
      raise exception 'Review and rate every one of your areas first.' using errcode = 'check_violation';
    end if;
  end loop;

  update public.assignment_accreditors set areas_sent_at = now()
   where assignment_id = p_assignment and profile_id = auth.uid();

  select profile_id into v_leader from public.assignment_accreditors
   where assignment_id = p_assignment and is_team_leader;
  select p.name into v_program
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
    join public.programs p on p.id = s.program_id
   where a.id = p_assignment;

  if v_leader is not null then
    perform public.notify_user(
      v_leader, 'score_released',
      'Areas received: ' || coalesce(v_program, 'a program'),
      'Your Assistant sent their areas. You can now generate the overall report.',
      '/portal/evaluation?a=' || p_assignment, auth.uid(), true
    );
  end if;
end;
$$;

revoke all on function public.send_areas_to_leader(uuid) from public;
grant execute on function public.send_areas_to_leader(uuid) to authenticated;

-- --------------------------------------------- the one overall report

create or replace function public.sign_accreditor_report(
  p_assignment uuid,
  p_findings   text,
  p_recommendation text,
  p_grand_mean numeric
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code    text;
  v_program text;
  v_level   text;
  v_signer  text;
  v_who     record;
  v_area    uuid;
begin
  if coalesce(btrim(p_findings), '') = '' then
    raise exception 'Write the overall findings before signing.' using errcode = 'check_violation';
  end if;
  if not exists (
    select 1 from public.assignment_accreditors
     where assignment_id = p_assignment and profile_id = auth.uid()
       and response = 'accepted' and is_team_leader
  ) then
    raise exception 'Only the Team Leader may sign the overall report.' using errcode = 'insufficient_privilege';
  end if;
  if exists (
    select 1 from public.accreditor_reports
     where assignment_id = p_assignment and accreditor_id = auth.uid()
       and status in ('submitted', 'acknowledged')
  ) then
    raise exception 'This report is already signed.' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.assignment_accreditors
     where assignment_id = p_assignment and not is_team_leader
       and response <> 'rejected' and areas_sent_at is null
  ) then
    raise exception 'Wait for your Assistant to send their areas.' using errcode = 'check_violation';
  end if;
  for v_area in select public.included_areas(p_assignment) loop
    if not public.area_is_evaluated(p_assignment, v_area) then
      raise exception 'Every area must be reviewed and rated first.' using errcode = 'check_violation';
    end if;
  end loop;

  v_code := 'QAC-EVAL-' || to_char(now() at time zone 'Asia/Manila', 'YYYY') || '-'
            || lpad(nextval('public.accreditor_report_seq')::text, 4, '0');

  insert into public.accreditor_reports
    (assignment_id, accreditor_id, overall_findings, recommendation, status, grand_mean, signed_at, doc_code, updated_at)
  values
    (p_assignment, auth.uid(), btrim(p_findings), btrim(coalesce(p_recommendation, '')), 'submitted', p_grand_mean, now(), v_code, now())
  on conflict (assignment_id, accreditor_id) do update
    set overall_findings = excluded.overall_findings,
        recommendation   = excluded.recommendation,
        status           = 'submitted',
        grand_mean       = excluded.grand_mean,
        signed_at        = excluded.signed_at,
        doc_code         = excluded.doc_code,
        qac_note         = null,
        updated_at       = now();

  select p.name, l.name into v_program, v_level
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
    join public.programs p on p.id = s.program_id
    join public.accreditation_levels l on l.id = s.level_id
   where a.id = p_assignment;
  select surname || ', ' || given_name into v_signer from public.profiles where id = auth.uid();

  for v_who in
    select id from public.profiles where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_who.id, 'score_released',
      'Overall report submitted: ' || coalesce(v_signer, 'The Team Leader') || ' (Team Leader) signed the '
        || coalesce(v_level, '') || ' overall evaluation report for ' || coalesce(v_program, 'a program') || '.',
      v_code, '/portal/assignment', auth.uid(), false
    );
  end loop;

  for v_who in
    select profile_id as id from public.assignment_accreditors
     where assignment_id = p_assignment and not is_team_leader and response = 'accepted'
  loop
    perform public.notify_user(
      v_who.id, 'score_released',
      'Overall report submitted: ' || coalesce(v_program, 'a program'),
      'The Team Leader signed and submitted it to QAC. You can view it.',
      '/portal/evaluation?a=' || p_assignment, auth.uid(), false
    );
  end loop;

  return v_code;
end;
$$;

revoke all on function public.sign_accreditor_report(uuid, text, text, numeric) from public;
grant execute on function public.sign_accreditor_report(uuid, text, text, numeric) to authenticated;

-- QAC acknowledges or returns the overall report -> tell both accreditors.
create or replace function public.notify_report_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program text;
  v_who     record;
begin
  if new.status = old.status or new.status not in ('acknowledged', 'returned') then
    return null;
  end if;

  select p.name into v_program
    from public.assignments a
    join public.submissions s on s.id = a.submission_id
    join public.programs p on p.id = s.program_id
   where a.id = new.assignment_id;

  for v_who in
    select profile_id, is_team_leader from public.assignment_accreditors
     where assignment_id = new.assignment_id and response = 'accepted'
       and (is_team_leader or new.status = 'acknowledged')
  loop
    perform public.notify_user(
      v_who.profile_id, 'score_released',
      case new.status
        when 'acknowledged' then 'Overall report acknowledged: ' || coalesce(v_program, 'a program')
        else 'Overall report returned: ' || coalesce(v_program, 'a program')
      end,
      case when new.status = 'returned' then new.qac_note else null end,
      '/portal/evaluation?a=' || new.assignment_id, new.reviewed_by, v_who.is_team_leader
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists notify_report_review on public.accreditor_reports;
create trigger notify_report_review
  after update on public.accreditor_reports
  for each row execute function public.notify_report_review();
