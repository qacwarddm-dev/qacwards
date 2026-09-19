-- 2026-09-19 client meeting: add MOA (Memorandum of Agreement) as a new
-- document under Phase 2 (Implementation), additive alongside the existing
-- five Phase 1 docs, which stay untouched.
--
-- `phase_documents` is shared across every accreditation level (its row count
-- is the constant half of `submission_readiness`'s denominator — see that
-- table's comment and the view in 20260818000500_submissions.sql). Adding a
-- 19th row here moves every level's required-document total up by one
-- (PSV/Level II 28->29, Level III 22->23, Level IV 23->24), which nudges the
-- client-confirmed O-17 counts. Flagged in plans/CLIENT-MEETING-TODOS.md
-- rather than silently left to drift — this is a client-requested addition
-- made after O-17 was confirmed, not a contradiction of it.
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 6, 'Memorandum of Agreement (MOA)', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
