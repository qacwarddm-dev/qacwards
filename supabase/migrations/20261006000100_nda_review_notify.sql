create or replace function public.notify_nda_for_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_who  record;
begin
  if new.status <> 'review' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.uploaded_at is not distinct from new.uploaded_at then
    return null;
  end if;

  select given_name || ' ' || surname into v_name from public.profiles where id = new.profile_id;

  for v_who in
    select id from public.profiles
     where role in ('qac_personnel', 'qac_admin') and is_active
  loop
    perform public.notify_user(
      v_who.id,
      'document_uploaded',
      'NDA for review: ' || coalesce(v_name, 'a program representative'),
      'Check the NDA File ID and notarial details',
      '/portal/documents?tab=nda&verify=' || new.profile_id,
      new.profile_id,
      true
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists notify_nda_for_review on public.ndas;
create trigger notify_nda_for_review
  after insert or update on public.ndas
  for each row execute function public.notify_nda_for_review();
