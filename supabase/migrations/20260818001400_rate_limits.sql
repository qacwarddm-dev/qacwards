-- B10: rate limits on the upload route. No such infrastructure existed —
-- Vercel functions are stateless across invocations, so a real limit needs
-- somewhere durable to count from, and Postgres is what is already here
-- rather than adding a dependency (Upstash/Redis) for one counter.
--
-- The table carries no RLS policies at all, deliberately — not even a caller
-- reading their own hits. Every access goes through `check_rate_limit()`, a
-- security definer function, so there is nothing to gain by querying the
-- table directly even for its own owner.

create table public.rate_limit_hits (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid not null references auth.users (id) on delete cascade,
  route      text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_actor_route_idx
  on public.rate_limit_hits (actor_id, route, created_at);

alter table public.rate_limit_hits enable row level security;

/**
 * Returns true and records a hit if the caller is under `p_max_count` calls
 * to `p_route` in the trailing `p_window_seconds`; returns false (and
 * records nothing) otherwise. `auth.uid()` inside a security definer
 * function still reads the real caller — same reasoning as
 * `my_assigned_submission_ids()` (BUG-4) — so this is safe to call from any
 * authenticated session without a caller-supplied identity to trust.
 *
 * The opportunistic delete keeps the table from growing unbounded without a
 * scheduled job: every row a caller owns ages out of their own window the
 * next time they hit this route, and the table is small enough (one row per
 * hit, one route today) that this is cheaper than a cron.
 */
create or replace function public.check_rate_limit(
  p_route text,
  p_max_count int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  recent_count int;
begin
  if caller is null then
    return false;
  end if;

  delete from public.rate_limit_hits
   where actor_id = caller
     and route = p_route
     and created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into recent_count
    from public.rate_limit_hits
   where actor_id = caller
     and route = p_route
     and created_at >= now() - (p_window_seconds || ' seconds')::interval;

  if recent_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_hits (actor_id, route) values (caller, p_route);
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to authenticated;
