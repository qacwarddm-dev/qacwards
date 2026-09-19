-- GENERATED FILE — DO NOT EDIT.
--
-- Written by `pnpm gen:seed` from src/lib/reference/*.ts. Edit those, not this.
-- `pnpm check:seed` fails when this file drifts from them.
--
-- Loaded by `supabase db reset`. Every statement is an upsert on a natural key,
-- so re-running is safe and ids stay stable across resets.

begin;


-- ---------------------------------------------------------------- campuses

insert into public.campuses (slug, name, is_main) values ('alfonso', 'Alfonso', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('bansud', 'Bansud', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('bataan', 'Bataan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('binan', 'Biñan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('cabiao', 'Cabiao', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('calauan', 'Calauan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('general-luna', 'General Luna', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('lopez', 'Lopez', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('maragondon', 'Maragondon', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('mulanay', 'Mulanay', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('paranaque', 'Parañaque', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('pulilan', 'Pulilan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('quezon-city', 'Quezon City', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('ragay', 'Ragay', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('sablayan', 'Sablayan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('san-juan', 'San Juan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('san-pedro', 'San Pedro', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('sta-maria', 'Sta. Maria', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('sta-mesa-manila', 'Sta. Mesa, Manila', true)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('sta-rosa', 'Sta. Rosa', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('sto-tomas', 'Sto. Tomas', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('taguig', 'Taguig', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;
insert into public.campuses (slug, name, is_main) values ('unisan', 'Unisan', false)
  on conflict (slug) do update set name = excluded.name, is_main = excluded.is_main;

-- ---------------------------------------------------------------- colleges

insert into public.colleges (code, name) values ('CADBE', 'College of Architecture, Design and the Built Environment')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CAF', 'College of Accountancy and Finance')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CAL', 'College of Arts and Letters')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CBA', 'College of Business Administration')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CCIS', 'College of Computer and Information Science')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('COC', 'College of Communication')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('COED', 'College of Education')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CE', 'College of Engineering')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CHK', 'College of Human Kinetics')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CPSPA', 'College of Political Science and Public Administration')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CS', 'College of Science')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CSSD', 'College of Social Sciences and Development')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('CTHTM', 'College of Tourism, Hospitality and Transportation Management')
  on conflict (code) do update set name = excluded.name;
insert into public.colleges (code, name) values ('GS', 'Graduate School')
  on conflict (code) do update set name = excluded.name;

-- ---------------------------------------------------------------- programs

insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'alfonso'), null, 'Bachelor of Science in Mechanical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'alfonso'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'alfonso'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bansud'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bansud'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bansud'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bansud'), null, 'Bachelor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'bataan'), null, 'Bachelor of Science in Management Accounting')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Science in Computer Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Secondary Education major in Social Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'binan'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'cabiao'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'cabiao'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'calauan'), null, 'Bachelor of Technology and Livelihood Education major in Home Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'calauan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'calauan'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'general-luna'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'general-luna'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'general-luna'), null, 'Bachelor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Architecture')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Agribusiness Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Business Administration major in Financial Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Biology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Civil Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Electrical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Nutrition and Dietetics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'lopez'), null, 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Science in Business Administration major in Financial Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Science in Electrical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Science in Mechanical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'maragondon'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'mulanay'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'mulanay'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'mulanay'), null, 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'mulanay'), null, 'Bachelor of Science in Agribusiness Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'mulanay'), null, 'Bachelor of Public Administration with specialization in Fiscal Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'paranaque'), null, 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'paranaque'), null, 'Bachelor of Science in Computer Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'paranaque'), null, 'Bachelor of Science in Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'paranaque'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'pulilan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'pulilan'), null, 'Bachelor of Public Administration with specialization in Fiscal Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Technology and Livelihood Education major in Home Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Technology and Livelihood Education major in Information and Communication Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Public Administration with specialization in Fiscal Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'quezon-city'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'ragay'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sablayan'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sablayan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sablayan'), null, 'Bachelor of Science in Cooperative Management major in Cooperative Education and Community Development')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sablayan'), null, 'Bachelor of Science in Cooperative Management major in Social Enterprise Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Business Administration major in Financial Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-juan'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'san-pedro'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Science in Computer Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Science in Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-maria'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CADBE'), 'Bachelor of Science in Architecture')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CADBE'), 'Bachelor of Science in Interior Design')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CADBE'), 'Bachelor of Science in Environmental Planning')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAF'), 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAF'), 'Bachelor of Science in Business Administration major in Financial Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAF'), 'Bachelor of Science in Management Accounting')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAL'), 'Bachelor of Arts in Filipinology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAL'), 'Bachelor of Arts in Philosophy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAL'), 'Bachelor of Arts in Literary and Cultural Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAL'), 'Bachelor of Arts in English Language Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CAL'), 'Bachelor of Performing Arts')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Bachelor of Science in Real Estate Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Master in Business Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CBA'), 'Doctor in Business Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CCIS'), 'Bachelor of Science in Computer Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CCIS'), 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COC'), 'Bachelor in Advertising and Public Relations')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COC'), 'Bachelor of Arts in Broadcasting')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COC'), 'Bachelor of Arts in Communication Research')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COC'), 'Bachelor of Arts in Journalism')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Early Childhood Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Library and Information Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Secondary Education major in Filipino')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Secondary Education major in Social Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Secondary Education major in Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Technology and Livelihood Education major in Home Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Technology and Livelihood Education major in Industrial Arts')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Bachelor of Technology and Livelihood Education major in Information and Communication Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Master in Library and Information Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Master of Arts in Education major in Mathematics Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Master of Arts in Education major in Teaching in the Challenged Areas')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Master of Arts in Education Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Master of Arts in English Language Teaching')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CHK'), 'Master of Arts in Physical Education and Sports')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'COED'), 'Doctor of Philosophy in Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Civil Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Computer Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Electrical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Mechanical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CE'), 'Bachelor of Science in Railway Engineering Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CHK'), 'Bachelor of Physical Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CHK'), 'Bachelor of Science in Exercise and Sports Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CPSPA'), 'Bachelor of Arts in Political Economy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CPSPA'), 'Bachelor of Arts in Political Science')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CPSPA'), 'Bachelor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CPSPA'), 'Master of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CPSPA'), 'Doctor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Applied Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Biology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Chemistry')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Food Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Nutrition and Dietetics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Physics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CS'), 'Bachelor of Science in Statistics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Arts in History')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Arts in Philippine Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Arts in Sociology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Science in Cooperative Management major in Cooperative Education and Community Development')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Science in Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CSSD'), 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CTHTM'), 'Bachelor of Science in Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CTHTM'), 'Bachelor of Science in Tourism Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'CTHTM'), 'Bachelor of Science in Transportation Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Doctor of Philosophy in Communication')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Doctor of Philosophy in Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Doctor of Philosophy in English Language Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Doctor of Philosophy in Filipino')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Doctor of Philosophy in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master in Applied Statistics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in Communication')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in English Language Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in Filipino')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in Philippine Studies')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Arts in Sociology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Biology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Civil Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Computer Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in International Tourism and Hospitality Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Master of Science in Nutrition and Dietetics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-mesa-manila'), (select id from public.colleges where code = 'GS'), 'Professional Science Master''s in Railway Engineering Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Accountancy')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Management Accounting')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Technology and Livelihood Education major in Home Economics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Secondary Education major in Filipino')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sta-rosa'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Public Administration with specialization in Fiscal Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Electrical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Industrial Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'sto-tomas'), null, 'Bachelor of Technology and Livelihood Education major in Information and Communication Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Mechanical Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Electronics Engineering')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Secondary Education major in English')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Secondary Education major in Mathematics')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Business Administration major in Marketing Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Business Administration major in Human Resource Management')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Office Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'taguig'), null, 'Bachelor of Science in Psychology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'unisan'), null, 'Bachelor of Elementary Education')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'unisan'), null, 'Bachelor of Science in Information Technology')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'unisan'), null, 'Bachelor of Science in Entrepreneurship')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;
insert into public.programs (campus_id, college_id, name) values (
  (select id from public.campuses where slug = 'unisan'), null, 'Bachelor of Public Administration')
  on conflict (campus_id, name) do update set college_id = excluded.college_id;

-- --------------------------------------------------------------- positions

insert into public.positions (name, scope) values ('Campus Director', 'program')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('College Dean', 'program')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('College Chairperson', 'program')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Faculty', 'program')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Director', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Asst. Director for Program Quality Assurance and Curriculum Development', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Asst. Director for Institutional and International Quality Assurance', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Chief, Quality Assurance for Main Campus', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Chief, Outcomes-Based Education and Continuous Quality Improvement', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Chief, Institutional Accreditation and Sustainability', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Chief, International Quality Assurance', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Quality Assurance Coordinator', 'qac')
  on conflict (name) do update set scope = excluded.scope;
insert into public.positions (name, scope) values ('Administrative Staff', 'qac')
  on conflict (name) do update set scope = excluded.scope;

-- --------------------------------------------------------- expertise areas

insert into public.expertise_areas (name) values ('Accountancy')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Accounting and Finance')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Administration and Governance')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Anthropology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Applied Mathematics')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Architecture')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Biology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Broadcasting')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Business Administration')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Chemistry')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Civil Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Communication Research')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Computer Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Computer Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Criminology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Creative Arts')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Cultural Studies')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Curriculum and Instruction')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Curriculum Development')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Cybersecurity')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Data Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Development Communication')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Economics')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Early Childhood Education')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Educational Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Electrical Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Electronics Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('English Language Studies')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Entrepreneurship')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Environmental Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Event Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Extension and Community Development')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Faculty Development')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Filipinolohiya')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Fitness and Sports Coaching')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('History')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Hospitality Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Higher Education Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Hotel and Restaurant Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Human Resource Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Industrial Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Information Systems')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Information Technology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Journalism')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Laboratories Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Legal Studies')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Library and Information Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Library Services')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Manufacturing Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Marketing Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Mathematics')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Mechanical Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Media and Information Studies')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Mission, Goals, and Objectives')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Music')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Network Security')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Office Administration')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Outcomes-Based Education (OBE)')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Performing Arts')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Philosophy')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Physical Education')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Physical Facilities Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Physics')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Political Economy')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Political Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Psychology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Public Administration')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Public Governance')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Quality Assurance in Higher Education')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Railway Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Records Management')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Research')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Research and Innovation')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Secondary Education')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Software Engineering')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Sociology')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Sports Science')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Statistics')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Student Services and Development')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Teacher Education')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Theater Arts')
  on conflict (name) do nothing;
insert into public.expertise_areas (name) values ('Tourism Management')
  on conflict (name) do nothing;

-- ---------------------------------------------------- accreditation levels

insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)
  values ('PSV', 'Preliminary Survey Visit', 1, null, null)
  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,
    validity_years = excluded.validity_years, required_choices = excluded.required_choices;
insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)
  values ('I', 'Level I', 2, null, null)
  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,
    validity_years = excluded.validity_years, required_choices = excluded.required_choices;
insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)
  values ('II', 'Level II', 3, null, null)
  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,
    validity_years = excluded.validity_years, required_choices = excluded.required_choices;
insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)
  values ('III', 'Level III', 4, null, 2)
  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,
    validity_years = excluded.validity_years, required_choices = excluded.required_choices;
insert into public.accreditation_levels (code, name, ordinal, validity_years, required_choices)
  values ('IV', 'Level IV', 5, 5, null)
  on conflict (code) do update set name = excluded.name, ordinal = excluded.ordinal,
    validity_years = excluded.validity_years, required_choices = excluded.required_choices;

-- ------------------------------------------------------------------ phases

insert into public.phases (ordinal, name) values (1, 'Planning')
  on conflict (ordinal) do update set name = excluded.name;
insert into public.phases (ordinal, name) values (2, 'Implementation')
  on conflict (ordinal) do update set name = excluded.name;
insert into public.phases (ordinal, name) values (3, 'Monitoring')
  on conflict (ordinal) do update set name = excluded.name;
insert into public.phases (ordinal, name) values (4, 'Evaluation')
  on conflict (ordinal) do update set name = excluded.name;

-- --------------------------------------------------------- phase documents

insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 1), 1, 'Notice of Meeting', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 1), 2, 'Minutes of the Meeting', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 1), 3, 'Project Proposal', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 1), 4, 'Action Plan', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 1), 5, 'Budget Proposal', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 1, 'Approved Proposal', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 2, 'Activity Program', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 3, 'Attendance', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 4, 'Photos', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 5, 'Narrative Report', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 2), 6, 'Memorandum of Agreement (MOA)', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 3), 1, 'Monitoring Report', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 3), 2, 'Progress Report', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 3), 3, 'Monitoring Checklist', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 3), 4, 'Site visit report (if conducted)', true)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 4), 1, 'Evaluation Results', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 4), 2, 'Terminal Report', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 4), 3, 'Impact Assessment', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.phase_documents (phase_id, ordinal, name, is_optional) values (
  (select id from public.phases where ordinal = 4), 4, 'Recommendations', false)
  on conflict (phase_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;

-- ------------------------------------------------------- requirement areas

insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 1, 'Area I - VMGO', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 2, 'Area II - Faculty', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 3, 'Area III - Curriculum & Instruction', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 4, 'Area IV - Support to Students', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 5, 'AREA V - Research', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 6, 'AREA VI - Extension & Community Involvement', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 7, 'Area VII - Library', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 8, 'Area VIII - Physical Plant & Facilities', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 9, 'Area IX - Laboratories', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'PSV'), 10, 'Area X - Administration', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 1, 'Area I - VMGO', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 2, 'Area II - Faculty', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 3, 'Area III - Curriculum & Instruction', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 4, 'Area IV - Support to Students', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 5, 'AREA V - Research', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 6, 'AREA VI - Extension & Community Involvement', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 7, 'Area VII - Library', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 8, 'Area VIII - Physical Plant & Facilities', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 9, 'Area IX - Laboratories', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'I'), 10, 'Area X - Administration', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 1, 'Area I - VMGO', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 2, 'Area II - Faculty', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 3, 'Area III - Curriculum & Instruction', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 4, 'Area IV - Support to Students', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 5, 'AREA V - Research', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 6, 'AREA VI - Extension & Community Involvement', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 7, 'Area VII - Library', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 8, 'Area VIII - Physical Plant & Facilities', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 9, 'Area IX - Laboratories', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'II'), 10, 'Area X - Administration', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 1, 'Instruction', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 2, 'Extension', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 3, 'Faculty Development', true)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 4, 'Research', true)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 5, 'Licensure Exam', true)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 6, 'Consortia or Linkages', true)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'III'), 7, 'Library', true)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'IV'), 1, 'Research', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'IV'), 2, 'Teaching and Learning', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'IV'), 3, 'Extension', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'IV'), 4, 'Internationalization', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;
insert into public.requirement_areas (level_id, ordinal, name, is_optional) values (
  (select id from public.accreditation_levels where code = 'IV'), 5, 'Planning Process', false)
  on conflict (level_id, ordinal) do update set name = excluded.name, is_optional = excluded.is_optional;

-- ------------------------------------------------------ repository folders

insert into public.repository_folders (slug, name, ordinal) values ('aaccup-certificate', 'AACCUP Certificate', 1)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;
insert into public.repository_folders (slug, name, ordinal) values ('aaccup-summary-of-findings-and-recommendation', 'AACCUP Summary of Findings and Recommendation', 2)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;
insert into public.repository_folders (slug, name, ordinal) values ('aaccup-technical-review', 'AACCUP Technical Review', 3)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;
insert into public.repository_folders (slug, name, ordinal) values ('certificate-of-compliance-copc-certificate', 'Certificate of Compliance (COPC) Certificate', 4)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;
insert into public.repository_folders (slug, name, ordinal) values ('certificate-of-compliance-copc-evaluation', 'Certificate of Compliance (COPC) Evaluation', 5)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;
insert into public.repository_folders (slug, name, ordinal) values ('other-files', 'Other Files', 6)
  on conflict (slug) do update set name = excluded.name, ordinal = excluded.ordinal;

commit;
