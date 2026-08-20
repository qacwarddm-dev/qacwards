-- Decision 21 — a **representative sample** of existing accreditation standing.
--
-- Real standing for CCIS and a few other colleges so the dashboards, the COPC
-- chart and the public status page have something true to show at the defence.
-- The remaining ~230 programmes start with no award, which is the honest state.
--
-- **This is explicitly not a production roster** and must not be described as
-- one. Nothing here was supplied by the owner; these are plausible demo values
-- chosen to exercise the four §2.7 transitions, not PUP's real accreditation
-- record. Replace before this system is used in earnest.
--
-- Not loaded by `supabase db reset` automatically — same as seed-dev.sql. Run:
--
--     psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed-awards.sql

begin;

-- Sta. Mesa programmes, by college code, with the level each currently holds.
-- Levels are given by code so this file never has to know a uuid.
create temporary table demo_awards (
  program_name text,
  college_code text,
  level_code   text,
  granted_on   date
) on commit drop;

insert into demo_awards values
  -- CCIS — the college decision 21 names, so it carries the fullest picture.
  ('Bachelor of Science in Computer Science',       'CCIS', 'IV',  date '2023-06-15'),
  ('Bachelor of Science in Information Technology', 'CCIS', 'III', date '2022-09-01'),

  -- A few other colleges, so the COPC chart is not a single-college story.
  ('Bachelor of Science in Accountancy',            'CAF',  'IV',  date '2021-11-20'),
  ('Bachelor of Science in Architecture',           'CADBE','II',  date '2024-02-10'),
  ('Bachelor of Arts in Journalism',                'COC',  'III', date '2023-01-30'),
  ('Bachelor of Elementary Education',              'COED', 'IV',  date '2020-08-05'),
  ('Bachelor of Science in Civil Engineering',      'CE',   'III', date '2024-05-12'),
  ('Bachelor of Science in Biology',                'CS',   'II',  date '2023-10-02'),
  ('Bachelor of Science in Psychology',             'CSSD', 'I',   date '2025-03-18'),
  ('Bachelor of Science in Tourism Management',     'CTHTM','II',  date '2024-07-22');

insert into public.program_accreditations (
  program_id, level_id, granted_on, valid_until, status
)
select
  p.id,
  l.id,
  d.granted_on,
  -- Only Level IV expires, so valid_until is null for everything else. The
  -- 2020 COED award is deliberately past its five years: it exercises the
  -- `expired` path in program_awards, which is computed rather than stored.
  case
    when l.validity_years is null then null
    else (d.granted_on + (l.validity_years || ' years')::interval)::date
  end,
  'active'
from demo_awards d
join public.campuses c  on c.slug = 'sta-mesa-manila'
join public.colleges co on co.code = d.college_code
join public.programs p  on p.name = d.program_name
                       and p.campus_id = c.id
                       and p.college_id = co.id
join public.accreditation_levels l on l.code = d.level_code
on conflict do nothing;

commit;
