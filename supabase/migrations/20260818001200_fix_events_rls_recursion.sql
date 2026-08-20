-- BUG-5 — pre-existing, from B7, unrelated to this session's other changes.
-- Found the same way as BUG-4: a live REST smoke test, not by reading the
-- schema. Any query touching `events` for any role failed:
--
--   {"code":"42P17","message":"infinite recursion detected in policy for
--   relation \"events\""}
--
-- Cause: "events are visible to their audience" (on `events`) queries
-- `event_audiences` and `event_programs` directly. Both of those tables'
-- SELECT policies ("audiences follow their event" / "event programs follow
-- their event") query `public.events` directly right back. All three tables
-- have RLS enabled, so the three policies form a cycle — structural, not
-- data-dependent, so it broke every caller and every role. This was never
-- caught because B7's acceptance needed a live database (BL-1) and never ran.
--
-- Same fix as BUG-4: the cross-table lookup moves into one `security
-- definer` function, whose body bypasses RLS on the tables it reads, so none
-- of the three policies queries another RLS-protected table directly anymore
-- — they all call this instead.

create or replace function public.visible_event_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
    from public.events e
   where public.is_active_user()
     and (
       not exists (select 1 from public.event_audiences ea where ea.event_id = e.id)
       or exists (
         select 1 from public.event_audiences ea
          where ea.event_id = e.id and ea.role = public.auth_role()
       )
       or exists (
         select 1 from public.event_programs ep
          where ep.event_id = e.id
            and ep.program_id in (select public.my_program_ids())
       )
     )
$$;

comment on function public.visible_event_ids() is
  'Which events the caller may see — an event with no audience rows is '
  'university-wide (B7). security definer so the reads inside it bypass RLS; '
  'used by all three of events/event_audiences/event_programs'' SELECT '
  'policies so none of them queries another RLS-protected table directly '
  '(BUG-5: that direct-query shape is what recursed).';

drop policy "events are visible to their audience" on public.events;
create policy "events are visible to their audience"
  on public.events for select to authenticated
  using (id in (select public.visible_event_ids()));

drop policy "audiences follow their event" on public.event_audiences;
create policy "audiences follow their event"
  on public.event_audiences for select to authenticated
  using (event_id in (select public.visible_event_ids()));

drop policy "event programs follow their event" on public.event_programs;
create policy "event programs follow their event"
  on public.event_programs for select to authenticated
  using (event_id in (select public.visible_event_ids()));
