-- Carrying a program over to a new cycle rewrites submissions.cycle_id, so the
-- closed cycle it came from forgot it ever took part. The Accreditation Archive
-- lists every program that took part in a closed cycle, finished or not, so the
-- cycle a submission leaves is recorded here the moment it leaves.

create table if not exists public.submission_cycle_history (
  submission_id uuid not null references public.submissions (id) on delete cascade,
  cycle_id      uuid not null references public.accreditation_cycles (id) on delete cascade,
  status        public.submission_status not null,
  moved_at      timestamptz not null default now(),
  primary key (submission_id, cycle_id)
);

create index if not exists submission_cycle_history_cycle_idx on public.submission_cycle_history (cycle_id);

create or replace function public.record_submission_cycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.submission_cycle_history (submission_id, cycle_id, status)
  values (old.id, old.cycle_id, old.status)
  on conflict (submission_id, cycle_id) do nothing;
  return new;
end;
$$;

drop trigger if exists submissions_record_cycle on public.submissions;
create trigger submissions_record_cycle
  before update of cycle_id on public.submissions
  for each row
  when (old.cycle_id is distinct from new.cycle_id)
  execute function public.record_submission_cycle();

alter table public.submission_cycle_history enable row level security;

drop policy if exists "cycle history follows its submission" on public.submission_cycle_history;
create policy "cycle history follows its submission"
  on public.submission_cycle_history for select to authenticated
  using (exists (select 1 from public.submissions s where s.id = submission_cycle_history.submission_id));

grant select on public.submission_cycle_history to authenticated;

-- Every submission that took part in a cycle: the ones still in it plus the ones
-- carried out of it. moved_to is the cycle a carried submission sits in now.
create or replace view public.cycle_members with (security_invoker = true) as
  select s.cycle_id,
         s.id as submission_id,
         s.program_id,
         s.status::text as status_at_close,
         null::uuid as moved_to
    from public.submissions s
  union all
  select h.cycle_id,
         h.submission_id,
         s.program_id,
         h.status::text,
         s.cycle_id
    from public.submission_cycle_history h
    join public.submissions s on s.id = h.submission_id;

-- The files a program had in a closed cycle, as they stood when it closed:
-- uploaded after the previous cycle it was in closed and by the time this one
-- closed, and not yet replaced by a newer version inside that window.
create or replace view public.cycle_documents with (security_invoker = true) as
  select m.cycle_id,
         m.submission_id,
         d.id as document_id
    from public.cycle_members m
    join public.accreditation_cycles c on c.id = m.cycle_id and c.status = 'closed' and c.closed_at is not null
    join public.submission_documents d on d.submission_id = m.submission_id
   where not d.is_draft
     and d.uploaded_at <= c.closed_at
     and d.uploaded_at > coalesce(
           (select max(c2.closed_at)
              from public.cycle_members m2
              join public.accreditation_cycles c2 on c2.id = m2.cycle_id
             where m2.submission_id = m.submission_id
               and c2.closed_at < c.closed_at),
           '-infinity'::timestamptz)
     and not exists (
           select 1
             from public.submission_documents n
            where n.supersedes_id = d.id
              and not n.is_draft
              and n.uploaded_at <= c.closed_at);

grant select on public.cycle_members, public.cycle_documents to authenticated;
