-- QAC Personnel starts an accreditation submission, not just the programme
-- representative: `createAssignmentForProgramLevel` now creates the
-- submission itself (status 'submitted') when a programme/level combination
-- has none, so a QAC Personnel can single-handedly start and assign in one
-- action. `submissions` only had a rep-scoped insert policy (B4) — this adds
-- the QAC-scoped counterpart, same open-cycle guard the rep policy uses.

create policy "qac starts submissions in an open cycle"
  on public.submissions for insert to authenticated
  with check (
    public.auth_role() in ('qac_personnel', 'qac_admin')
    and exists (
      select 1 from public.accreditation_cycles c
       where c.id = cycle_id and c.status = 'open'
    )
  );
