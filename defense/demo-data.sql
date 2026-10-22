-- Demo records for the offline defense. Loaded once, after supabase/seed.sql
-- (reference data) and supabase/seed-dev.sql (the six role accounts), by
-- `defense/cli.mjs start` when the database has no users. Idempotent.
--
-- These are sample records, not recovered production data. Pass the shared demo
-- password in: psql -v devpw=... -f defense/demo-data.sql

\o /dev/null
select set_config('app.devpw', :'devpw', true);
\o

begin;

do $$
declare
  acct   record;
  new_id uuid;
begin
  for acct in
    select * from (values
      ('accreditor2@pup.edu.ph', 'Villanueva', 'Rosario',  'sta-mesa-manila'),
      ('accreditor3@pup.edu.ph', 'Mendoza',    'Gerardo',  'sta-mesa-manila'),
      ('accreditor4@pup.edu.ph', 'Aquino',     'Cristina', 'sta-mesa-manila')
    ) as t(email, surname, given_name, campus)
  loop
    if exists (select 1 from auth.users where email = acct.email) then
      continue;
    end if;
    new_id := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    )
    values (
      new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      acct.email, crypt(current_setting('app.devpw'), gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object(
        'role', 'internal_accreditor',
        'surname', acct.surname,
        'given_name', acct.given_name,
        'campus', acct.campus,
        'college', '',
        'position', 'Faculty'
      ),
      now(), now(), '', '', '', '', '', '', '', ''
    );
  end loop;
end
$$;

insert into public.accreditor_expertise (profile_id, expertise_area_id)
select p.id, e.id
  from public.profiles p
  join public.expertise_areas e
    on e.name in ('Information Technology', 'Computer Science', 'Software Engineering')
 where p.webmail in ('accreditor2@pup.edu.ph', 'accreditor3@pup.edu.ph', 'accreditor4@pup.edu.ph')
on conflict do nothing;

insert into public.accreditation_cycles (name, description, start_date, end_date, status, created_by)
select 'AY 2026-2027 Accreditation Cycle',
       'Demonstration cycle for the thesis defense.',
       date '2026-08-01', date '2027-07-31', 'open',
       (select id from public.profiles where webmail = 'admin@pup.edu.ph')
 where not exists (select 1 from public.accreditation_cycles where status = 'open');

insert into public.submissions (cycle_id, program_id, level_id, status)
select cy.id, pr.id, lv.id, 'not_started'
  from public.accreditation_cycles cy
  join public.programs pr on pr.name in (
         'Bachelor of Science in Information Technology',
         'Bachelor of Science in Computer Science')
  join public.campuses ca on ca.id = pr.campus_id and ca.slug = 'sta-mesa-manila'
  join public.accreditation_levels lv on lv.code = 'PSV'
 where cy.status = 'open'
   and not exists (
     select 1 from public.submissions s
      where s.program_id = pr.id and s.level_id = lv.id
   );

commit;
