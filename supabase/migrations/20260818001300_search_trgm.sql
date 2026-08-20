-- §8.2: search wants pg_trgm GIN indexes, not sequential ILIKE scans, and it
-- has to run through RLS so a search never reveals a row's existence by an
-- absence the caller cannot otherwise see. `kit/DataTable.tsx` gained a
-- `search` prop this pass (§8.3's sibling ask, done the same way: once, in
-- the kit); this is the first real index behind it, for `/portal/settings/users`.

create extension if not exists pg_trgm;

-- Three indexes, not one over the concatenation: PostgREST's `.or(...)`
-- filters on real columns, one condition per column — it cannot express a
-- filter against a computed expression without a stored generated column,
-- which is a bigger schema change than a search box needs. Each column gets
-- its own trigram index instead, and the query ORs the three conditions
-- together (`searchUsers` in src/lib/admin.ts); Postgres uses whichever
-- index matches each side of the OR.
create index profiles_surname_trgm_idx
  on public.profiles using gin (surname gin_trgm_ops);
create index profiles_given_name_trgm_idx
  on public.profiles using gin (given_name gin_trgm_ops);
create index profiles_webmail_trgm_idx
  on public.profiles using gin (webmail gin_trgm_ops);
