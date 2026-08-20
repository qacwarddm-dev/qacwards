-- Development fixtures. **Never runs in production.**
--
-- Deleting the dev cookie switcher in B2 removed the only way to look at four
-- roles' screens, so without this B3–B9 have nothing to build against. These are
-- four real Supabase Auth accounts with real profile rows, created the same way
-- the register flow creates them — the trigger does the profile insert, so this
-- file exercises that path rather than working around it.
--
-- Not loaded by `supabase db reset` automatically. Either add it to
-- `[db.seed] sql_paths` in supabase/config.toml for local work, or run:
--
--     psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed-dev.sql
--
-- **The password is supplied, not stored here.** Pass it in:
--
--     psql "…" -v devpw="$DEV_PASSWORD" -f supabase/seed-dev.sql
--
-- It used to be the literal `DevPassword1`, which was fine while the only target
-- was localhost. The moment a hosted project became a target, a guessable
-- password for four accounts sat in a committed file — so the file no longer
-- knows it. `DEV_PASSWORD` lives in `.env`, which is gitignored.
--
-- It travels through a GUC rather than `:'devpw'` at the point of use because
-- psql does **not** interpolate variables inside dollar-quoted strings, and the
-- insert below lives inside a `do $$ … $$` block.
--
-- The service role is what runs this, which is legitimate: seeds and migrations
-- are exactly where it belongs (plans/BACKEND.md §1). It must never appear in a
-- request path.

-- pgcrypto supplies crypt()/gen_salt(); Supabase enables it, but a bare local
-- Postgres may not, and a missing function here fails the whole seed.
create extension if not exists pgcrypto with schema extensions;

begin;

-- Fail loudly rather than seeding four accounts with an empty or trivial
-- password because a -v flag was forgotten.
-- Output redirected: set_config returns its argument, and a seed should not
-- print the password it was handed into the terminal or CI log.
\o /dev/null
select set_config('app.devpw', :'devpw', true);
\o

do $$
begin
  if coalesce(length(current_setting('app.devpw', true)), 0) < 12 then
    raise exception
      'Pass a password of at least 12 characters: psql -v devpw="$DEV_PASSWORD" -f supabase/seed-dev.sql';
  end if;
end
$$;

-- One programme every rep fixture points at. CCIS is the college decision 21
-- names for the representative sample of real standing, so the demo data stays
-- consistent with the awards seeded in B5.
create temporary table dev_accounts (
  email      text,
  role       public.user_role,
  surname    text,
  given_name text,
  campus     text,
  college    text,
  position   text
) on commit drop;

insert into dev_accounts values
  ('rep@pup.edu.ph',        'program_representative', 'Reyes',   'Marisol', 'sta-mesa-manila', 'CCIS', 'College Dean'),
  -- B10's RLS suite needs a second representative on a distinct programme to
  -- prove rep-vs-rep isolation, not just the four role boundaries — the
  -- earlier matrix only ever had one rep account to test with.
  ('rep2@pup.edu.ph',       'program_representative', 'Cruz',    'Bernardo', 'lopez', null, 'College Dean'),
  ('accreditor@pup.edu.ph', 'internal_accreditor',    'Santos',  'Ferdinand', 'sta-mesa-manila', null,  'Faculty'),
  ('qac@pup.edu.ph',        'qac_personnel',          'Dela Cruz', 'Aurora', null, null, 'Quality Assurance Coordinator'),
  ('admin@pup.edu.ph',      'qac_admin',              'Bautista', 'Ignacio', null, null, 'Director'),
  -- B8's scheduled jobs sign in as this one. It is a QAC Admin because the
  -- email outbox is admin-scoped, and a real account rather than the service
  -- role because service role bypasses every policy in the database and this
  -- only needs two (src/lib/supabase/mailer.ts).
  ('mailer@pup.edu.ph',     'qac_admin',              'Mailer',   'System',  null, null, 'Director');

do $$
declare
  acct   record;
  new_id uuid;
begin
  for acct in select * from dev_accounts loop
    -- Idempotent: re-running the seed must not error or duplicate anyone.
    if exists (select 1 from auth.users where email = acct.email) then
      continue;
    end if;

    new_id := gen_random_uuid();

    -- email_confirmed_at is set so these accounts can sign in immediately; the
    -- register flow gets there by verifying an OTP instead.
    -- The eight token columns are set to '' and NOT left NULL, which is the
    -- whole reason this insert is longer than it looks like it should be.
    -- GoTrue scans them into Go `string`, so a NULL is not "no token" — it is a
    -- scan failure, and the login endpoint answers every attempt with
    -- `{"code":500,"error_code":"unexpected_failure","msg":"Database error
    -- querying schema"}`. The rows look perfect in psql; nothing can sign in.
    -- Supabase's own signup path writes '' here, so this matches it.
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    )
    values (
      new_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      acct.email,
      crypt(current_setting('app.devpw'), gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object(
        'role', acct.role::text,
        'surname', acct.surname,
        'given_name', acct.given_name,
        'campus', coalesce(acct.campus, ''),
        'college', coalesce(acct.college, ''),
        'position', acct.position
      ),
      now(),
      now(),
      '', '', '', '', '', '', '', ''
    );

    -- handle_new_user() has written the profile by now. qac_admin is the one role
    -- the trigger deliberately refuses to grant (it is provisioned, never
    -- self-registered), so it is set here — which is the provisioning path.
    if acct.role = 'qac_admin' then
      update public.profiles set role = 'qac_admin' where id = new_id;
      update auth.users
         set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'qac_admin')
       where id = new_id;
    end if;
  end loop;
end
$$;

-- Give the accreditor something to be matched on, and the rep some programmes to
-- represent — two CCIS programmes, so the "many programmes per rep" case in
-- decision 6 is exercised rather than assumed.

insert into public.accreditor_expertise (profile_id, expertise_area_id)
select p.id, e.id
  from public.profiles p
  join public.expertise_areas e
    on e.name in ('Information Technology', 'Computer Science', 'Software Engineering')
 where p.webmail = 'accreditor@pup.edu.ph'
on conflict do nothing;

insert into public.program_reps (profile_id, program_id)
select p.id, pr.id
  from public.profiles p
  join public.programs pr on pr.name in (
         'Bachelor of Science in Information Technology',
         'Bachelor of Science in Computer Science'
       )
  join public.campuses c on c.id = pr.campus_id and c.slug = 'sta-mesa-manila'
 where p.webmail = 'rep@pup.edu.ph'
on conflict do nothing;

-- rep2's one programme, on a different campus from rep@'s two — the point is
-- that it shares nothing with rep@'s programmes, so a cross-read test has
-- something real to fail against.
insert into public.program_reps (profile_id, program_id)
select p.id, pr.id
  from public.profiles p
  join public.programs pr on pr.name = 'Bachelor of Science in Civil Engineering'
  join public.campuses c on c.id = pr.campus_id and c.slug = 'lopez'
 where p.webmail = 'rep2@pup.edu.ph'
on conflict do nothing;

commit;
