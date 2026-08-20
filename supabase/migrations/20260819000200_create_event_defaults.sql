-- Follow-up to 20260819000100: `create_event`'s optional fields
-- (description, end_time, kind, roles) had no SQL defaults, so `supabase gen
-- types` emitted every Arg as non-nullable and the caller was forced to pass
-- an explicit `null` the generated type didn't allow. Giving them real
-- defaults lets the client omit the ones it has nothing to send, which is
-- also just the more honest signature — these were always optional in
-- practice (an event with no description, no end time, or no audience is a
-- normal event, not an error).
--
-- CREATE OR REPLACE cannot reorder/retype an existing function's parameters,
-- so the old positional signature is dropped first.
drop function if exists public.create_event(
  text, text, timestamptz, timestamptz, public.event_kind, public.user_role[]
);

create function public.create_event(
  p_title       text,
  p_start_time  timestamptz,
  p_description text default null,
  p_end_time    timestamptz default null,
  p_kind        public.event_kind default 'meeting',
  p_roles       public.user_role[] default null
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

comment on function public.create_event(text, timestamptz, text, timestamptz, public.event_kind, public.user_role[]) is
  'BUG-7: one transaction for the event row and its audience rows, so the '
  'deferred notify_event_scheduled trigger sees the final audience at commit '
  'instead of firing after just the first of two separate REST calls.';
