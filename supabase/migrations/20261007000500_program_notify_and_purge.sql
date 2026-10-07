-- Client feedback: (1) adding a program never notified anyone; the college/campus it
-- lands in should hear about it. (2) Recently Deleted needs a permanent delete.

alter type public.notification_kind add value if not exists 'program_added';

create or replace function public.notify_program_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_where  text;
  v_person record;
begin
  if new.deleted_at is not null then
    return null;
  end if;

  select concat_ws(' · ', c.code, ca.name) into v_where
    from public.campuses ca
    left join public.colleges c on c.id = new.college_id
   where ca.id = new.campus_id;

  for v_person in
    select id from public.profiles
     where is_active
       and deleted_at is null
       and campus_id = new.campus_id
       and (new.college_id is null or college_id = new.college_id)
  loop
    perform public.notify_user(
      v_person.id,
      'program_added',
      'New program added: ' || new.name,
      v_where,
      null,
      auth.uid(),
      false
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists notify_program_added on public.programs;
create trigger notify_program_added
  after insert on public.programs
  for each row execute function public.notify_program_added();

create or replace function public.admin_purge_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if public.auth_role() <> 'qac_admin' then
    raise exception 'Only the QAC Admin can permanently delete users.' using errcode = 'insufficient_privilege';
  end if;
  if p_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;
  if not exists (select 1 from public.profiles where id = p_id and deleted_at is not null) then
    raise exception 'Only a deleted user can be permanently removed.';
  end if;

  begin
    delete from auth.users where id = p_id;
  exception when foreign_key_violation then
    raise exception 'This person has evaluation history on record, so the account cannot be permanently removed.';
  end;
end;
$$;

create or replace function public.admin_purge_program(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.auth_role() <> 'qac_admin' then
    raise exception 'Only the QAC Admin can permanently delete programs.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.programs where id = p_id and deleted_at is not null) then
    raise exception 'Only a deleted program can be permanently removed.';
  end if;
  if exists (select 1 from public.submissions where program_id = p_id) then
    raise exception 'This program has accreditation history on record, so it cannot be permanently removed.';
  end if;
  if exists (select 1 from public.repository_files where program_id = p_id) then
    raise exception 'This program still has repository files. Delete those permanently first.';
  end if;

  delete from public.programs where id = p_id;
end;
$$;

revoke all on function public.admin_purge_user(uuid) from public;
revoke all on function public.admin_purge_program(uuid) from public;
grant execute on function public.admin_purge_user(uuid) to authenticated;
grant execute on function public.admin_purge_program(uuid) to authenticated;

create policy "qac deletes archived repository files"
  on public.repository_files for delete to authenticated
  using (public.is_qac() and is_archived);

create policy "qac deletes from the repository bucket"
  on storage.objects for delete to authenticated
  using (bucket_id = 'repository' and public.is_qac());

create policy "qac admin deletes any avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.auth_role() = 'qac_admin');
