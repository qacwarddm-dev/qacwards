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
       and nullif(btrim(ar.remark), '') is not null
  ) >= 3
$$;
