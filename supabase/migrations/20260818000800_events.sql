-- B7 — Events and the calendar.
--
-- The manuscript gives events a single `target_role_id`. That cannot express
-- "this concerns Program Representatives *and* Internal Accreditors", which the
-- calendar plainly needs, so audiences are a join table (§2.5, §9).

create type public.event_kind as enum (
  'meeting',
  'survey_visit',
  'deadline',
  'holiday',
  'other'
);

create table public.events (
  id           uuid primary key default uuid_generate_v4(),
  cycle_id     uuid references public.accreditation_cycles (id) on delete set null,
  title        text not null,
  description  text,

  -- timestamptz, never bare timestamp (§8.4). Event times are operationally
  -- meaningful and both Vercel and Supabase run UTC; a naive timestamp would
  -- drift the moment it left this machine. Displayed in Asia/Manila.
  start_time   timestamptz not null,
  end_time     timestamptz,

  kind         public.event_kind not null default 'meeting',
  created_by   uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  created_at   timestamptz not null default now(),

  constraint events_time_order_check check (end_time is null or end_time >= start_time)
);

create index events_start_time_idx on public.events (start_time);

create table public.event_audiences (
  event_id uuid not null references public.events (id) on delete cascade,
  role     public.user_role not null,
  primary key (event_id, role)
);

-- Programme-scoped visits: a survey visit concerns one programme's people, not
-- every representative in the university.
create table public.event_programs (
  event_id   uuid not null references public.events (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  primary key (event_id, program_id)
);

-- --------------------------------------------------------------------- RLS

alter table public.events          enable row level security;
alter table public.event_audiences enable row level security;
alter table public.event_programs  enable row level security;

/**
 * An event is visible when it is addressed to you.
 *
 * Three ways that can be true, and the first one matters: an event with **no
 * audience rows at all** is university-wide. Without that case a QAC user who
 * forgets to tick a role publishes an event nobody can see, which is a silent
 * failure — worse than an over-broad one, because nothing looks wrong.
 */
create policy "events are visible to their audience"
  on public.events for select to authenticated
  using (
    public.is_active_user()
    and (
      not exists (select 1 from public.event_audiences ea where ea.event_id = id)
      or exists (
        select 1 from public.event_audiences ea
         where ea.event_id = id and ea.role = public.auth_role()
      )
      or exists (
        select 1 from public.event_programs ep
         where ep.event_id = id
           and ep.program_id in (select public.my_program_ids())
      )
    )
  );

create policy "qac creates events"
  on public.events for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac updates events"
  on public.events for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- No delete policy: an event is cancelled (`cancelled_at`), not erased. People
-- planned around it, so it stays on the calendar struck through.

create policy "audiences follow their event"
  on public.event_audiences for select to authenticated
  using (event_id in (select id from public.events));

create policy "qac sets audiences"
  on public.event_audiences for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac clears audiences"
  on public.event_audiences for delete to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "event programs follow their event"
  on public.event_programs for select to authenticated
  using (event_id in (select id from public.events));

create policy "qac scopes events to programs"
  on public.event_programs for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac unscopes events"
  on public.event_programs for delete to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));
