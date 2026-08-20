-- B3 — Accreditation cycles, the rep↔programme mapping, and user administration.
--
-- A cycle is an **institutional scheduling window** — QAC opens "AACCUP Survey
-- Visit 2026" and everything submitted belongs to it (decision 11/19, §0.1). It
-- is not "this programme's Nth attempt at this level"; that is
-- `submissions.attempt`, and conflating the two is the single most likely
-- misreading of this schema.

create type public.cycle_status as enum ('draft', 'open', 'closed');

create table public.accreditation_cycles (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  start_date  date not null,
  end_date    date not null,
  status      public.cycle_status not null default 'draft',
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint accreditation_cycles_dates_check check (end_date >= start_date)
);

create index accreditation_cycles_status_idx on public.accreditation_cycles (status);

comment on table public.accreditation_cycles is
  'Institution-wide scheduling window. O-14: closing a cycle freezes its work in '
  'place, read-only — uploads stop, the record stays visible as history, and the '
  'programme re-submits fresh next cycle. Nothing is lost and nothing silently '
  'continues. The read-only part is enforced by the write policies B4 adds, which '
  'all require the cycle to be open.';

-- Only one cycle may be open at a time. Submissions hang off a cycle, and two
-- open windows would make "the current cycle" ambiguous at exactly the moment a
-- representative is trying to file something.
create unique index accreditation_cycles_single_open_idx
  on public.accreditation_cycles ((status))
  where status = 'open';

-- ------------------------------------------------------------------- audit
--
-- Deactivating an account and changing someone's role are the two administrative
-- acts that most need a paper trail, and B8's activity_logs triggers do not exist
-- yet. Recording who did what to whom from the start costs one table and means
-- B8 has history to show rather than starting from empty.

create table public.admin_actions (
  id          uuid primary key default uuid_generate_v4(),
  actor_id    uuid references public.profiles (id) on delete set null,
  target_id   uuid references public.profiles (id) on delete set null,
  action      text not null,
  old_value   jsonb,
  new_value   jsonb,
  created_at  timestamptz not null default now()
);

create index admin_actions_target_id_idx on public.admin_actions (target_id);

create or replace function public.log_profile_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    insert into public.admin_actions (actor_id, target_id, action, old_value, new_value)
    values (auth.uid(), new.id, 'role_changed',
            jsonb_build_object('role', old.role), jsonb_build_object('role', new.role));
  end if;

  if new.is_active is distinct from old.is_active then
    insert into public.admin_actions (actor_id, target_id, action,
            old_value, new_value)
    values (auth.uid(), new.id,
            case when new.is_active then 'reactivated' else 'deactivated' end,
            jsonb_build_object('is_active', old.is_active),
            jsonb_build_object('is_active', new.is_active));
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger log_profile_admin_change
  before update on public.profiles
  for each row execute function public.log_profile_admin_change();

-- --------------------------------------------------------------------- RLS

alter table public.accreditation_cycles enable row level security;
alter table public.admin_actions        enable row level security;

-- Everyone signed in can see cycles: a representative's submission screen has to
-- name the window it is filing into. Only QAC writes them.
create policy "cycles are readable by authenticated users"
  on public.accreditation_cycles for select to authenticated
  using (public.is_active_user());

create policy "qac creates cycles"
  on public.accreditation_cycles for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac updates cycles"
  on public.accreditation_cycles for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- No delete policy, deliberately. A cycle with submissions behind it is history;
-- closing it is the way to end it.

create policy "admin reads admin actions"
  on public.admin_actions for select to authenticated
  using (public.auth_role() = 'qac_admin');

-- ------------------------------------------------- program_reps write policies
--
-- B2 created the table with read policies only and left writing to this phase.
-- Attaching a representative to a programme is an administrative act, so QAC owns
-- it; a representative cannot add themselves to a programme.

create policy "qac attaches reps to programs"
  on public.program_reps for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "qac detaches reps from programs"
  on public.program_reps for delete to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- ------------------------------------------------------ profiles: admin writes
--
-- B2 gave qac_admin an update policy already. This adds the read every user-admin
-- screen needs and nothing more: QAC Personnel can list users (to build an
-- assignment team) but only QAC Admin can change what a user is.
