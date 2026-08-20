-- B1 — Reference data tables.
--
-- Every table here is fixed institutional vocabulary: campuses, colleges,
-- programmes, positions, expertise areas, levels, phases and their documents,
-- requirement areas, repository folders. Rows come from supabase/seed.sql, which
-- is generated from src/lib/reference/*.ts by `pnpm gen:seed`.
--
-- These carry natural keys (slug / code / ordinal) rather than being pure surrogate
-- tables, because the seed has to be re-runnable: `db reset` must land the same ids
-- every time or the dev fixtures in later phases drift underneath.
--
-- RLS: reference data is readable by every authenticated user and writable by no
-- one through the API. It changes by migration + seed, never by a request, so
-- there is no insert/update/delete policy at all — the absence of a policy is the
-- denial (plans/BACKEND.md §1).

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------- campuses

create table public.campuses (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name        text not null unique,
  is_main     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.campuses is
  'The 23 PUP campuses. is_main is true for Sta. Mesa, Manila only.';

-- ---------------------------------------------------------------- colleges

create table public.colleges (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

comment on table public.colleges is
  'The 14 main-campus colleges. Off-main-campus programmes have no college.';

-- ---------------------------------------------------------------- programs

create table public.programs (
  id          uuid primary key default uuid_generate_v4(),
  campus_id   uuid not null references public.campuses (id) on delete restrict,
  college_id  uuid references public.colleges (id) on delete restrict,
  name        text not null,
  created_at  timestamptz not null default now(),

  -- decision 6: the same programme name on a different campus is a different
  -- programme, so the key is the pair, not the name.
  constraint programs_campus_name_key unique (campus_id, name)
);

create index programs_campus_id_idx on public.programs (campus_id);
create index programs_college_id_idx on public.programs (college_id);

comment on table public.programs is
  'Every degree programme, per campus. college_id is set for main campus only.';

-- ---------------------------------------------------------------- positions

create type public.position_scope as enum ('program', 'qac');

create table public.positions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  scope       public.position_scope not null,
  created_at  timestamptz not null default now()
);

comment on table public.positions is
  '13 positions: 4 held by academic programme staff, 9 by QAC personnel.';

-- ---------------------------------------------------------- expertise areas

create table public.expertise_areas (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  created_at  timestamptz not null default now()
);

comment on table public.expertise_areas is
  'Accreditor specializations. Matched against programmes when assigning a team.';

-- ----------------------------------------------------- accreditation levels

create table public.accreditation_levels (
  id               uuid primary key default uuid_generate_v4(),
  code             text not null unique,
  name             text not null unique,
  ordinal          int not null unique,

  -- Only Level IV expires (decision 19 / O-9). Null means the award never lapses,
  -- which is why this is nullable rather than 0.
  validity_years   int,

  -- Level III asks the programme to pick 2 of its 5 optional areas. Null elsewhere.
  required_choices int,

  created_at       timestamptz not null default now(),

  constraint accreditation_levels_validity_years_check
    check (validity_years is null or validity_years > 0),
  constraint accreditation_levels_required_choices_check
    check (required_choices is null or required_choices > 0)
);

comment on column public.accreditation_levels.validity_years is
  'Years an award at this level stays valid. Null = never expires. Level IV = 5.';

-- ------------------------------------------------------------------ phases

create table public.phases (
  id          uuid primary key default uuid_generate_v4(),
  ordinal     int not null unique,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table public.phase_documents (
  id          uuid primary key default uuid_generate_v4(),
  phase_id    uuid not null references public.phases (id) on delete cascade,
  ordinal     int not null,
  name        text not null,

  -- "Site visit report (if conducted)". It still counts toward the denominator of
  -- 18 — the level-card totals only work if it does. See open item O-3.
  is_optional boolean not null default false,

  created_at  timestamptz not null default now(),

  constraint phase_documents_phase_ordinal_key unique (phase_id, ordinal)
);

create index phase_documents_phase_id_idx on public.phase_documents (phase_id);

comment on table public.phase_documents is
  'The 18 pre-accreditation documents (5+5+4+4), identical for every level. The '
  'constant half of the readiness denominator.';

-- -------------------------------------------------------- requirement areas

create table public.requirement_areas (
  id          uuid primary key default uuid_generate_v4(),
  level_id    uuid not null references public.accreditation_levels (id) on delete cascade,
  ordinal     int not null,
  name        text not null,

  -- True only for Level III's five choose-from areas.
  is_optional boolean not null default false,

  created_at  timestamptz not null default now(),

  constraint requirement_areas_level_ordinal_key unique (level_id, ordinal)
);

create index requirement_areas_level_id_idx on public.requirement_areas (level_id);

comment on table public.requirement_areas is
  'Areas per level. Rows are per level, not a shared vocabulary: PSV/I/II each '
  'carry their own copy of the 10 Areas because they are three separate '
  'submissions with three separate readiness scores (decision 9).';

-- ------------------------------------------------------- repository folders

create table public.repository_folders (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name        text not null unique,
  ordinal     int not null unique,
  created_at  timestamptz not null default now()
);

comment on table public.repository_folders is
  'The six AACCUP/COPC folders every programme repository is organised into.';

-- --------------------------------------------------------------------- RLS
--
-- Read for any signed-in user; no write policy anywhere, so the API cannot
-- mutate reference data at all. Anonymous visitors get nothing — the public site
-- is static and does not query these.

alter table public.campuses             enable row level security;
alter table public.colleges             enable row level security;
alter table public.programs             enable row level security;
alter table public.positions            enable row level security;
alter table public.expertise_areas      enable row level security;
alter table public.accreditation_levels enable row level security;
alter table public.phases               enable row level security;
alter table public.phase_documents      enable row level security;
alter table public.requirement_areas    enable row level security;
alter table public.repository_folders   enable row level security;

create policy "reference is readable by authenticated users"
  on public.campuses for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.colleges for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.programs for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.positions for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.expertise_areas for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.accreditation_levels for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.phases for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.phase_documents for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.requirement_areas for select to authenticated using (true);
create policy "reference is readable by authenticated users"
  on public.repository_folders for select to authenticated using (true);
