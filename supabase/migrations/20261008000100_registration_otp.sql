-- Registration no longer creates an account until the password step.
-- Step 1 stores a temporary OTP row, step 2 verifies it, step 3 inserts the user.

create extension if not exists pgcrypto with schema extensions;

drop trigger if exists enforce_pup_webmail on auth.users;
drop function if exists public.enforce_pup_webmail();
alter table public.profiles drop constraint if exists profiles_webmail_domain_check;

create table if not exists public.registration_otps (
  email        text primary key,
  code_hash    text not null,
  payload      jsonb not null,
  ip           text,
  attempts     integer not null default 0,
  send_count   integer not null default 1,
  window_start timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  verified_at  timestamptz,
  token_hash   text,
  created_at   timestamptz not null default now()
);

create index if not exists registration_otps_ip_idx on public.registration_otps (ip, last_sent_at);

alter table public.registration_otps enable row level security;
revoke all on public.registration_otps from anon, authenticated;

create or replace function public.register_issue_otp(
  p_email text,
  p_data jsonb,
  p_expertise text,
  p_ip text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_row     public.registration_otps;
  v_found   boolean;
  v_reset   boolean := false;
  v_code    text;
  v_payload jsonb;
begin
  if public.auth_role() is distinct from 'qac_admin' then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  if length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_email');
  end if;

  if coalesce(btrim(p_data ->> 'surname'), '') = '' or coalesce(btrim(p_data ->> 'given_name'), '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_details');
  end if;

  if exists (
    select 1 from auth.users u
     where lower(u.email) = v_email and u.email_confirmed_at is not null
  ) then
    return jsonb_build_object('ok', false, 'reason', 'already_registered');
  end if;

  v_payload := jsonb_build_object(
    'role',           left(coalesce(p_data ->> 'role', ''), 40),
    'surname',        left(btrim(coalesce(p_data ->> 'surname', '')), 100),
    'given_name',     left(btrim(coalesce(p_data ->> 'given_name', '')), 100),
    'middle_initial', left(btrim(coalesce(p_data ->> 'middle_initial', '')), 4),
    'campus',         left(coalesce(p_data ->> 'campus', ''), 60),
    'college',        left(coalesce(p_data ->> 'college', ''), 60),
    'position',       left(coalesce(p_data ->> 'position', ''), 120),
    'expertise',      left(coalesce(p_expertise, ''), 120)
  );

  delete from public.registration_otps where expires_at < now() - interval '1 day';

  select * into v_row from public.registration_otps where email = v_email for update;
  v_found := found;

  if v_found then
    if v_row.last_sent_at > now() - interval '60 seconds' then
      if v_row.verified_at is null and v_row.expires_at > now() then
        update public.registration_otps set payload = v_payload, ip = p_ip where email = v_email;
        return jsonb_build_object(
          'ok', true,
          'code', null,
          'expires_in', ceil(extract(epoch from v_row.expires_at - now()))::int,
          'resend_in', ceil(extract(epoch from v_row.last_sent_at + interval '60 seconds' - now()))::int
        );
      end if;
      return jsonb_build_object(
        'ok', false, 'reason', 'cooldown',
        'wait', ceil(extract(epoch from v_row.last_sent_at + interval '60 seconds' - now()))::int
      );
    end if;

    v_reset := v_row.window_start <= now() - interval '1 hour';
    if not v_reset and v_row.send_count >= 5 then
      return jsonb_build_object('ok', false, 'reason', 'too_many');
    end if;
  end if;

  if coalesce(p_ip, '') <> '' and (
    select count(*) from public.registration_otps
     where ip = p_ip and email <> v_email and last_sent_at > now() - interval '1 hour'
  ) >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  v_code := lpad(
    ((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text,
    6, '0'
  );

  insert into public.registration_otps as r (
    email, code_hash, payload, ip, attempts, send_count,
    window_start, last_sent_at, expires_at, verified_at, token_hash
  )
  values (
    v_email,
    encode(extensions.digest(v_email || ':' || v_code, 'sha256'), 'hex'),
    v_payload,
    p_ip,
    0,
    case when v_found and not v_reset then v_row.send_count + 1 else 1 end,
    case when v_found and not v_reset then v_row.window_start else now() end,
    now(),
    now() + interval '10 minutes',
    null,
    null
  )
  on conflict (email) do update set
    code_hash    = excluded.code_hash,
    payload      = excluded.payload,
    ip           = excluded.ip,
    attempts     = 0,
    send_count   = excluded.send_count,
    window_start = excluded.window_start,
    last_sent_at = excluded.last_sent_at,
    expires_at   = excluded.expires_at,
    verified_at  = null,
    token_hash   = null;

  return jsonb_build_object('ok', true, 'code', v_code, 'expires_in', 600, 'resend_in', 60);
end;
$$;

create or replace function public.register_discard_otp(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() is distinct from 'qac_admin' then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  delete from public.registration_otps
   where email = lower(btrim(coalesce(p_email, ''))) and verified_at is null;
end;
$$;

create or replace function public.register_verify_otp(p_email text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_row   public.registration_otps;
  v_token text;
begin
  select * into v_row from public.registration_otps where email = v_email for update;

  if not found or v_row.verified_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'no_code');
  end if;

  if v_row.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_row.attempts >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'locked');
  end if;

  if v_row.code_hash <> encode(extensions.digest(v_email || ':' || btrim(coalesce(p_code, '')), 'sha256'), 'hex') then
    update public.registration_otps set attempts = attempts + 1 where email = v_email;
    return jsonb_build_object('ok', false, 'reason', 'wrong', 'left', greatest(4 - v_row.attempts, 0));
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

  update public.registration_otps
     set verified_at = now(),
         token_hash  = encode(extensions.digest(v_token, 'sha256'), 'hex'),
         expires_at  = now() + interval '30 minutes'
   where email = v_email;

  return jsonb_build_object('ok', true, 'token', v_token, 'expires_in', 1800);
end;
$$;

create or replace function public.register_check_token(p_email text, p_token text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.registration_otps
     where email = lower(btrim(coalesce(p_email, '')))
       and verified_at is not null
       and expires_at > now()
       and token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
  )
$$;

create or replace function public.register_complete(
  p_email text,
  p_token text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email    text := lower(btrim(coalesce(p_email, '')));
  v_row      public.registration_otps;
  v_old_id   uuid;
  v_old_conf timestamptz;
  v_id       uuid := gen_random_uuid();
  v_role     public.user_role;
begin
  select * into v_row from public.registration_otps
   where email = v_email
     and verified_at is not null
     and expires_at > now()
     and token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_verified');
  end if;

  if length(coalesce(p_password, '')) < 8
     or octet_length(p_password) > 72
     or p_password !~ '[0-9]' then
    return jsonb_build_object('ok', false, 'reason', 'weak_password');
  end if;

  select id, email_confirmed_at into v_old_id, v_old_conf
    from auth.users where lower(email) = v_email;

  if found then
    if v_old_conf is not null then
      delete from public.registration_otps where email = v_email;
      return jsonb_build_object('ok', false, 'reason', 'already_registered');
    end if;
    delete from auth.users where id = v_old_id;
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  )
  values (
    v_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    (v_row.payload - 'expertise') || jsonb_build_object('email_verified', true),
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  )
  values (
    gen_random_uuid(),
    v_id,
    v_id::text,
    'email',
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
  );

  select role into v_role from public.profiles where id = v_id;

  if v_role = 'internal_accreditor' and coalesce(v_row.payload ->> 'expertise', '') <> '' then
    insert into public.accreditor_expertise (profile_id, expertise_area_id)
    select v_id, e.id from public.expertise_areas e
     where e.name = v_row.payload ->> 'expertise'
    on conflict do nothing;
  end if;

  delete from public.registration_otps where email = v_email;

  return jsonb_build_object('ok', true, 'email', v_email);
end;
$$;

revoke execute on function public.register_issue_otp(text, jsonb, text, text) from public, anon;
revoke execute on function public.register_discard_otp(text) from public, anon;
revoke execute on function public.register_verify_otp(text, text) from public;
revoke execute on function public.register_check_token(text, text) from public;
revoke execute on function public.register_complete(text, text, text) from public;

grant execute on function public.register_issue_otp(text, jsonb, text, text) to authenticated;
grant execute on function public.register_discard_otp(text) to authenticated;
grant execute on function public.register_verify_otp(text, text) to anon, authenticated;
grant execute on function public.register_check_token(text, text) to anon, authenticated;
grant execute on function public.register_complete(text, text, text) to anon, authenticated;
