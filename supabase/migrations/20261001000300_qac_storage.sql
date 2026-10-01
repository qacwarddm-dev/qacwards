-- QAC manages Common Documents without holding an NDA of its own: it must read
-- (View) and remove (Replace/Delete) the objects it uploads.

drop policy if exists "qac reads the common-docs bucket" on storage.objects;
create policy "qac reads the common-docs bucket"
  on storage.objects for select to authenticated
  using (bucket_id = 'common-docs' and public.is_qac());

drop policy if exists "qac deletes from the common-docs bucket" on storage.objects;
create policy "qac deletes from the common-docs bucket"
  on storage.objects for delete to authenticated
  using (bucket_id = 'common-docs' and public.is_qac());

-- Settings › Users: people the Director invited who haven't registered yet.
create table if not exists public.user_invitations (
  id          uuid primary key default gen_random_uuid(),
  webmail     text not null unique,
  surname     text not null,
  given_name  text not null,
  role        public.user_role not null,
  is_internal_accreditor boolean not null default false,
  invited_by  uuid references public.profiles (id) on delete set null,
  invited_at  timestamptz not null default now(),
  sent_count  integer not null default 1
);

alter table public.user_invitations enable row level security;

drop policy if exists "admin manages invitations" on public.user_invitations;
create policy "admin manages invitations"
  on public.user_invitations for all to authenticated
  using (public.auth_role() = 'qac_admin') with check (public.auth_role() = 'qac_admin');

drop trigger if exists log_activity on public.user_invitations;
create trigger log_activity after insert or update or delete on public.user_invitations
  for each row execute function public.log_activity();

-- Admin-only reads of auth state the app cannot reach without the service role.
create or replace function public.admin_last_activity()
returns table (profile_id uuid, last_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select actor_id, max(created_at)
    from public.activity_logs
   where public.auth_role() = 'qac_admin' and actor_id is not null
   group by actor_id
$$;

create or replace function public.admin_sessions()
returns table (id uuid, user_id uuid, user_agent text, ip text, last_seen timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select s.id, s.user_id, s.user_agent, host(s.ip), coalesce(s.refreshed_at, s.updated_at, s.created_at)
    from auth.sessions s
   where public.auth_role() = 'qac_admin'
     and (s.not_after is null or s.not_after > now())
   order by coalesce(s.refreshed_at, s.updated_at, s.created_at) desc
   limit 100
$$;

create or replace function public.admin_end_sessions(p_session uuid default null, p_user uuid default null)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  n integer;
begin
  if public.auth_role() <> 'qac_admin' then
    raise exception 'Only the QAC Admin can end sessions.' using errcode = 'insufficient_privilege';
  end if;
  if p_session is null and p_user is null then
    return 0;
  end if;
  delete from auth.sessions
   where (p_session is not null and id = p_session)
      or (p_user is not null and user_id = p_user);
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.admin_storage_usage()
returns bigint
language sql
stable
security definer
set search_path = public, storage
as $$
  select coalesce(sum((metadata->>'size')::bigint), 0)
    from storage.objects
   where public.auth_role() = 'qac_admin'
$$;

revoke all on function public.admin_last_activity() from public;
revoke all on function public.admin_sessions() from public;
revoke all on function public.admin_end_sessions(uuid, uuid) from public;
revoke all on function public.admin_storage_usage() from public;
grant execute on function public.admin_last_activity() to authenticated;
grant execute on function public.admin_sessions() to authenticated;
grant execute on function public.admin_end_sessions(uuid, uuid) to authenticated;
grant execute on function public.admin_storage_usage() to authenticated;

-- Invitations go to people with no profile yet, so notify_user() can't reach them.
create or replace function public.admin_queue_email(p_to text, p_subject text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'qac_admin' then
    raise exception 'Only the QAC Admin can queue emails.' using errcode = 'insufficient_privilege';
  end if;
  insert into public.email_outbox (to_email, subject, body) values (p_to, p_subject, p_body);
end;
$$;

revoke all on function public.admin_queue_email(text, text, text) from public;
grant execute on function public.admin_queue_email(text, text, text) to authenticated;
