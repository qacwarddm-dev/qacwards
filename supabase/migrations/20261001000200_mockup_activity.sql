-- Activity for the mockup workflow tables, plus account events that never
-- touch a table (password changes happen in auth).

do $$
declare
  t text;
begin
  foreach t in array array[
    'document_reviews', 'accreditor_reports', 'saved_reports', 'announcements',
    'site_settings', 'system_backups', 'template_versions', 'repository_units'
  ] loop
    execute format('drop trigger if exists log_activity on public.%I', t);
    execute format(
      'create trigger log_activity after insert or update or delete on public.%I
         for each row execute function public.log_activity()',
      t
    );
  end loop;
end;
$$;

create or replace function public.log_self_event(p_kind text, p_detail text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_kind not in ('password_changed', 'photo_changed', 'photo_removed', 'signature_saved',
                    'signature_uploaded', 'contact_updated', 'notif_prefs_updated', 'signed_in') then
    raise exception 'Unknown account event.' using errcode = 'check_violation';
  end if;
  insert into public.activity_logs (actor_id, action_type, target_table, target_id, new_value)
  values (auth.uid(), p_kind, 'account_events', auth.uid(), jsonb_build_object('detail', p_detail));
end;
$$;

revoke all on function public.log_self_event(text, text) from public;
grant execute on function public.log_self_event(text, text) to authenticated;

-- Accreditors review documents while the level is open, and a returned file can
-- be resubmitted after the level was submitted (mockup: "You can still replace
-- documents that are returned for revision").
drop policy if exists "reps upload to their own open submissions" on public.submission_documents;
create policy "reps upload to their own open submissions"
  on public.submission_documents for insert to authenticated
  with check (
    exists (
      select 1
        from public.submissions s
        join public.accreditation_cycles c on c.id = s.cycle_id
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
         and s.status in ('not_started', 'in_progress', 'returned', 'submitted', 'under_evaluation')
         and c.status = 'open'
    )
  );

-- Drafts are the representative's own scratch rows: removable at any stage.
drop policy if exists "reps delete their own drafts" on public.submission_documents;
create policy "reps delete their own drafts"
  on public.submission_documents for delete to authenticated
  using (
    is_draft
    and exists (
      select 1 from public.submissions s
       where s.id = submission_id
         and s.program_id in (select public.my_program_ids())
    )
  );

-- QAC nudges a program rep or accreditor ("Send reminder").
create or replace function public.send_reminder(p_profile uuid, p_title text, p_link text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_qac() then
    raise exception 'Only QAC can send reminders.' using errcode = 'insufficient_privilege';
  end if;
  perform public.notify_user(p_profile, 'account', p_title, null, p_link, auth.uid(), true);
end;
$$;

revoke all on function public.send_reminder(uuid, text, text) from public;
grant execute on function public.send_reminder(uuid, text, text) to authenticated;

-- A file filed under a QAC-made folder (repository_units) rather than its program's college/campus.
alter table public.repository_files
  add column if not exists unit_id uuid references public.repository_units (id) on delete set null;
