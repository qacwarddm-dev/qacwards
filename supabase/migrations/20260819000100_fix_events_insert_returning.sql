-- BUG-6 and BUG-7 — found live while verifying B8's event-notice email class,
-- neither caught before now because B7's acceptance needed a live database
-- (BL-1) and never ran, and BUG-5's fix (20260818001200) only chased down the
-- policy-cycle recursion, not this pair.
--
-- BUG-6: `events`' SELECT policy is `id in (select public.visible_event_ids())`,
-- and `visible_event_ids()` re-scans `public.events` from scratch. Postgres
-- checks a SELECT policy against the RETURNING output of an INSERT, and a
-- statement cannot see rows it is itself in the middle of inserting through a
-- nested re-query of the same table — so the just-inserted row always fails
-- its own SELECT policy at RETURNING time. Confirmed live: identical INSERT
-- payload against a real hosted project, `Prefer: return=minimal` → 201,
-- `Prefer: return=representation` → 403 `{"code":"42501","message":"new row
-- violates row-level security policy for table \"events\""}`, every time,
-- regardless of role. `createEvent()` calls `.select("id").single()`, which is
-- return=representation — this bug meant **no QAC user could ever create an
-- event through the UI**, full stop, not a fan-out edge case.
--
-- Fixed by making the events SELECT policy evaluate the row it is already
-- being asked about, instead of re-deriving that row's identity through a
-- self-join back into `events`. `event_visible_to_caller(id)` never queries
-- `events` at all, so there is nothing for the just-inserted row to be
-- invisible to.
create or replace function public.event_visible_to_caller(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_user()
     and (
       not exists (select 1 from public.event_audiences ea where ea.event_id = p_event_id)
       or exists (
         select 1 from public.event_audiences ea
          where ea.event_id = p_event_id and ea.role = public.auth_role()
       )
       or exists (
         select 1
         from public.event_programs ep
         where ep.event_id = p_event_id
           and ep.program_id in (select public.my_program_ids())
       )
     )
$$;

comment on function public.event_visible_to_caller(uuid) is
  'Per-row replacement for visible_event_ids() (BUG-5): takes the row''s id '
  'directly instead of re-scanning events to find it, which is what let an '
  'INSERT ... RETURNING on events fail its own just-inserted row against the '
  'SELECT policy (BUG-6). security definer so the event_audiences/'
  'event_programs reads inside it bypass RLS, same reasoning as BUG-5''s fix.';

drop policy "events are visible to their audience" on public.events;
create policy "events are visible to their audience"
  on public.events for select to authenticated
  using (public.event_visible_to_caller(id));

drop policy "audiences follow their event" on public.event_audiences;
create policy "audiences follow their event"
  on public.event_audiences for select to authenticated
  using (public.event_visible_to_caller(event_id));

drop policy "event programs follow their event" on public.event_programs;
create policy "event programs follow their event"
  on public.event_programs for select to authenticated
  using (public.event_visible_to_caller(event_id));

-- visible_event_ids() is superseded by the per-row function above and had no
-- caller outside these three policies (checked: not referenced from src/).
drop function if exists public.visible_event_ids();

-- BUG-7: `createEvent()` (src/lib/event-actions.ts) inserted the event row and
-- its `event_audiences` rows as two separate PostgREST calls — two separate
-- transactions. `notify_event_scheduled` is a deferred constraint trigger
-- specifically so the audience is final by the time it fires (D-24); split
-- across two transactions, it fires at the FIRST transaction's commit, before
-- any audience row exists, which B7 defines as university-wide. Every
-- targeted event would have mailed the whole university — the exact failure
-- D-24 exists to prevent, reintroduced one layer up. Fixed by making both
-- inserts one statement's work, in one transaction, via this RPC; `security
-- invoker` (the default) so RLS still applies to both inserts under the
-- caller's own role — this changes transaction shape only, not authorization.
create or replace function public.create_event(
  p_title       text,
  p_description text,
  p_start_time  timestamptz,
  p_end_time    timestamptz,
  p_kind        public.event_kind,
  p_roles       public.user_role[]
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.events (title, description, start_time, end_time, kind, created_by)
  values (p_title, nullif(p_description, ''), p_start_time, p_end_time, p_kind, auth.uid())
  returning id into v_id;

  if p_roles is not null and array_length(p_roles, 1) > 0 then
    insert into public.event_audiences (event_id, role)
    select v_id, r from unnest(p_roles) as r;
  end if;

  return v_id;
end;
$$;

comment on function public.create_event(text, text, timestamptz, timestamptz, public.event_kind, public.user_role[]) is
  'BUG-7: one transaction for the event row and its audience rows, so the '
  'deferred notify_event_scheduled trigger sees the final audience at commit '
  'instead of firing after just the first of two separate REST calls.';
