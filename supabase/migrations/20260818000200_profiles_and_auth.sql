-- B2 — Identity: profiles, the auth.users trigger, and the RLS helpers every
-- later phase's policies are written against.
--
-- Decision 1 makes signup fully self-service: a verified @pup.edu.ph webmail plus
-- a role picked at registration is immediate access, with no admin approval gate.
-- What that removes is the approval step, not UC-019's deactivation — see
-- is_active below.

-- ------------------------------------------------------------------- role

create type public.user_role as enum (
  'program_representative',
  'internal_accreditor',
  'qac_personnel',
  'qac_admin'
);

comment on type public.user_role is
  'The enum value stays program_representative even though the UI labels that '
  'role "Academic Program" (open item O-4). Renaming it would ripple through '
  'every route, component and policy for a cosmetic gain.';

-- --------------------------------------------------------------- profiles

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  role           public.user_role not null,

  surname        text not null,
  given_name     text not null,
  middle_initial text,

  campus_id      uuid references public.campuses (id) on delete restrict,
  college_id     uuid references public.colleges (id) on delete restrict,
  position_id    uuid references public.positions (id) on delete restrict,

  webmail        text not null unique,
  avatar_path    text,

  -- UC-019. False must bite on the next request, not the next login, which is
  -- why it is a predicate in every policy below as well as a middleware check.
  is_active      boolean not null default true,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint profiles_webmail_domain_check
    check (webmail ~* '^[^@[:space:]]+@pup\.edu\.ph$')
);

create index profiles_role_idx      on public.profiles (role);
create index profiles_campus_id_idx on public.profiles (campus_id);

comment on table public.profiles is
  'One row per auth.users row, created by the on_auth_user_created trigger.';

-- ------------------------------------------------- accreditor expertise M:N

create table public.accreditor_expertise (
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  expertise_area_id uuid not null references public.expertise_areas (id) on delete restrict,
  primary key (profile_id, expertise_area_id)
);

-- ------------------------------------------------------ rep ↔ program M:N

create table public.program_reps (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, program_id)
);

create index program_reps_program_id_idx on public.program_reps (program_id);

comment on table public.program_reps is
  'Decision 6: a representative can hold many programmes, and the same programme '
  'name on another campus is a different programme row.';

-- ------------------------------------------------------------- @pup.edu.ph
--
-- Enforced here rather than in the register form. A client-side check is bypassed
-- by one direct call to the Auth API, so the only place this can actually hold is
-- the database.

create or replace function public.enforce_pup_webmail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email !~* '^[^@[:space:]]+@pup\.edu\.ph$' then
    raise exception 'Only @pup.edu.ph webmail addresses may register'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger enforce_pup_webmail
  before insert on auth.users
  for each row execute function public.enforce_pup_webmail();

-- ------------------------------------------- profile creation + app_metadata
--
-- The role travels on the JWT in app_metadata, never user_metadata — a user can
-- edit their own user_metadata, which would make the role self-assigned
-- (plans/BACKEND.md §1).
--
-- Registration passes its form fields through raw_user_meta_data; this trigger
-- reads them once, writes the profile row, and mirrors only the role upward.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  chosen_role public.user_role;
begin
  -- qac_admin is provisioned, never self-registered, so it is not reachable from
  -- the form; anything unrecognised falls back to the least-privileged role.
  begin
    chosen_role := (meta ->> 'role')::public.user_role;
  exception when others then
    chosen_role := 'program_representative';
  end;

  if chosen_role = 'qac_admin' then
    chosen_role := 'qac_personnel';
  end if;

  insert into public.profiles (
    id, role, surname, given_name, middle_initial,
    campus_id, college_id, position_id, webmail
  )
  values (
    new.id,
    chosen_role,
    coalesce(nullif(meta ->> 'surname', ''), ''),
    coalesce(nullif(meta ->> 'given_name', ''), ''),
    nullif(meta ->> 'middle_initial', ''),
    (select id from public.campuses  where slug = meta ->> 'campus'),
    (select id from public.colleges  where code = meta ->> 'college'),
    (select id from public.positions where name = meta ->> 'position'),
    new.email
  );

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                             || jsonb_build_object('role', chosen_role)
   where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ RLS helpers
--
-- Every later phase's policies are written in terms of these three, so the
-- definition of "who am I" and "what may I see" lives in one place.

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

comment on function public.auth_role() is
  'The signed-in user''s role, or null when signed out OR deactivated. Returning '
  'null for a deactivated user is deliberate: every policy comparing against this '
  'then fails closed without needing its own is_active clause.';

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active)
$$;

create or replace function public.my_program_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select pr.program_id
    from public.program_reps pr
    join public.profiles p on p.id = pr.profile_id
   where pr.profile_id = auth.uid()
     and p.is_active
$$;

comment on function public.my_program_ids() is
  'Programmes the signed-in representative currently holds. O-15: access follows '
  'the current mapping, so losing a programme loses access to its submissions.';

-- -------------------------------------------------------------------- RLS

alter table public.profiles             enable row level security;
alter table public.accreditor_expertise enable row level security;
alter table public.program_reps         enable row level security;

-- Own row, always. QAC sees everyone — assignment needs to list accreditors and
-- user administration needs to list everyone.
create policy "read own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "qac reads all profiles"
  on public.profiles for select to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- Deliberately narrow. Personal details are display-only after registration
-- (owner, 2026-08-01), so the only self-service write is the avatar. Role,
-- campus, college, position and is_active are not updatable through the API by
-- their owner at all.
create policy "update own avatar"
  on public.profiles for update to authenticated
  using (id = auth.uid() and is_active)
  with check (id = auth.uid() and is_active);

create policy "qac admin updates any profile"
  on public.profiles for update to authenticated
  using (public.auth_role() = 'qac_admin')
  with check (public.auth_role() = 'qac_admin');

create policy "read own expertise"
  on public.accreditor_expertise for select to authenticated
  using (profile_id = auth.uid() or public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "read own program mapping"
  on public.program_reps for select to authenticated
  using (profile_id = auth.uid() or public.auth_role() in ('qac_personnel', 'qac_admin'));

-- B3 owns writing program_reps; until then nothing but the service role can.
