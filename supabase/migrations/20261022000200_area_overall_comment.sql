-- Client feedback 2026-10-22: an area gets ONE overall comment, not a remark under each
-- of its three indicators. Ratings stay per indicator in area_ratings; the comment lives
-- here, one row per accreditor per area. area_ratings.remark is no longer written.

create table if not exists public.area_comments (
  assignment_id       uuid not null references public.assignments (id) on delete cascade,
  accreditor_id       uuid not null references public.profiles (id) on delete cascade,
  requirement_area_id uuid not null references public.requirement_areas (id) on delete cascade,
  remark              text not null default '',
  updated_at          timestamptz not null default now(),
  primary key (assignment_id, accreditor_id, requirement_area_id)
);

alter table public.area_comments enable row level security;

drop policy if exists "team and qac read area comments" on public.area_comments;
create policy "team and qac read area comments"
  on public.area_comments for select to authenticated
  using (assignment_id in (select public.my_assignment_ids()) or public.is_qac());

drop policy if exists "accreditors comment on their own areas" on public.area_comments;
create policy "accreditors comment on their own areas"
  on public.area_comments for all to authenticated
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

-- Keep what accreditors already wrote: their three remarks become one comment.
insert into public.area_comments (assignment_id, accreditor_id, requirement_area_id, remark, updated_at)
select assignment_id, accreditor_id, requirement_area_id,
       string_agg(btrim(remark), E'\n' order by indicator), max(updated_at)
  from public.area_ratings
 where nullif(btrim(remark), '') is not null
 group by assignment_id, accreditor_id, requirement_area_id
on conflict do nothing;

comment on column public.area_ratings.remark is
  'Deprecated: superseded by area_comments (one overall comment per area). Kept for history.';

-- An area is evaluated once its document is approved, all three indicators are rated,
-- and the area has its overall comment.
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
  ) >= 3 and exists (
    select 1
      from public.area_comments ac
     where ac.assignment_id = p_assignment
       and ac.requirement_area_id = p_area
       and nullif(btrim(ac.remark), '') is not null
  )
$$;
