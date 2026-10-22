-- Explicit Data API grants for the `public` schema.
--
-- Until now these came from `auto_expose_new_tables = true` in supabase/config.toml, a deprecated
-- setting that is being removed (and that a fresh local database on a client's PC did not honour,
-- leaving the app unable to read any table). Supabase Cloud is moving the same way: new tables are
-- not reachable through the API without a GRANT. Row Level Security still decides which rows each
-- role sees; this only makes the tables reachable at all, exactly as the legacy default did.
--
-- Idempotent: on a database that already has these grants it changes nothing.

grant usage on schema public to anon, authenticated, service_role;

do $$
declare
  rel record;
begin
  for rel in
    select c.oid::regclass as name
      from pg_class c
     where c.relnamespace = 'public'::regnamespace
       and c.relkind in ('r', 'p', 'v', 'm', 'f')
       -- Locked down on purpose in 20261008000100_registration_otp.sql: only the SECURITY DEFINER
       -- registration functions may touch it.
       and c.relname <> 'registration_otps'
  loop
    execute format('grant all on %s to anon, authenticated, service_role', rel.name);
  end loop;
end $$;

grant all on all sequences in schema public to anon, authenticated, service_role;

-- Objects created later by migrations (run as `postgres`) get the same grants.
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
