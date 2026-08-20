-- Two real RLS gaps, found wiring B9's dashboards against the live database
-- rather than reasoning about the schema on paper.

-- BUG: `submissions` had a SELECT policy for reps (own programme) and for QAC
-- (all), but none for accreditors. Every embedded `submissions(...)` read off
-- `assignments` (getAssignments, the evaluation screens) would silently come
-- back null for an accreditor, and `submission_documents` was unreachable for
-- them too, because "documents follow their submission" reads through
-- submissions' own RLS. B5's evaluation flow was never exercised end to end
-- (BL-1 blocked it), so this never surfaced until now.
create policy "accreditors read submissions on their assignments"
  on public.submissions for select to authenticated
  using (
    id in (
      select submission_id from public.assignments
       where id in (select public.my_assignment_ids())
    )
  );

-- The Program Representative dashboard's "Document Status Distribution" chart
-- needs each document's review outcome (approved / pending / disapproved).
-- `evaluation_items` is deliberately team+QAC-only — it also carries internal
-- notes, scores and who decided, none of which a representative should see.
-- This view exposes only the decision, gated by the exact same "who can read
-- this submission" predicate as the three `submissions` SELECT policies above
-- (own programme / QAC / own assignment), reimplemented here rather than
-- inherited because the view runs as its owner (security_invoker is left at
-- its default of false) so it can see past evaluation_items' RLS at all.
-- `my_program_ids()` / `auth_role()` / `my_assignment_ids()` all key off
-- `auth.uid()`, which reads the caller's JWT regardless of definer/invoker
-- context, so the caller identity here is still the real one.
create or replace view public.submission_document_status as
select
  sd.id as submission_document_id,
  sd.submission_id,
  latest.decision
from public.submission_documents sd
join public.submissions s on s.id = sd.submission_id
left join lateral (
  select ei.decision
    from public.evaluation_items ei
   where ei.submission_document_id = sd.id
   order by ei.decided_at desc nulls last, ei.created_at desc
   limit 1
) latest on true
where s.program_id in (select public.my_program_ids())
   or public.auth_role() in ('qac_personnel', 'qac_admin')
   or s.id in (
        select submission_id from public.assignments
         where id in (select public.my_assignment_ids())
      );

grant select on public.submission_document_status to authenticated;

comment on view public.submission_document_status is
  'Decision-only, narrow cross-RLS read: exposes evaluation_items.decision to '
  'anyone who can already read the document, without exposing the rest of '
  'evaluation_items (notes, scores, decided_by) to a representative. Keep the '
  'where clause in sync with the submissions SELECT policies by hand — it '
  'cannot inherit them, since this view runs as its owner.';
