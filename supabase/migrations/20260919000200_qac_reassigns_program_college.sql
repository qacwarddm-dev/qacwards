-- 2026-09-19 client meeting: QAC Admin / QAC Personnel drag-and-drop program
-- reassignment (Program Management). `programs` had no UPDATE policy at all —
-- every prior college_id fix (e.g. O-18b) went in by hand over psql — so the
-- app-driven reassignment in getProgramsByCollege/reassignProgramCollege
-- (src/lib/admin.ts) needs this to not be silently rejected by RLS.
create policy "qac reassigns program college"
  on public.programs for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));
