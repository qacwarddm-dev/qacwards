-- Round 2 §1 — an assignment every invited accreditor declined.
--
-- Its own migration because Postgres forbids using a new enum label in the same
-- transaction that adds it, and the rest of round 2 (20260906000200) both reads
-- and writes this one.
--
-- `declined` is a terminal-until-reassigned state, not a sixth step of the
-- five-step Stepper: the assignment sits in the QAC Personnel queue until they
-- put a new team on it, which returns it to `assigned`. The submission stays at
-- `under_evaluation` throughout — the assignment row still exists and
-- `assignments.submission_id` is UNIQUE, so reassignment replaces the team on
-- the same assignment rather than creating a second one.

alter type public.assignment_status add value if not exists 'declined';
