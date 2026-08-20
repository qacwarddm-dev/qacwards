-- B6 — The other three document families: templates, the AACCUP/COPC repository,
-- and common documents behind the NDA gate.
--
-- Decision 12: four families in total (templates / submissions / repository /
-- common), and **the repository is programme-written too**, not QAC-only. That is
-- why its write policies name both roles.

-- ------------------------------------------------------------- templates

create table public.templates (
  id                  uuid primary key default uuid_generate_v4(),
  level_id            uuid references public.accreditation_levels (id) on delete cascade,
  requirement_area_id uuid references public.requirement_areas (id) on delete cascade,
  phase_document_id   uuid references public.phase_documents (id) on delete cascade,
  title               text not null,
  storage_path        text not null,
  uploaded_by         uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);

comment on table public.templates is
  'Blank forms a programme downloads before filling one in. All three foreign '
  'keys are nullable and none is exclusive: a template can belong to a level, to '
  'one area, to one phase document, or to none of them (a general form).';

-- ------------------------------------------------------ repository files

create table public.repository_files (
  id           uuid primary key default uuid_generate_v4(),
  program_id   uuid not null references public.programs (id) on delete cascade,
  folder_id    uuid not null references public.repository_folders (id) on delete restrict,
  title        text not null,
  storage_path text not null,
  file_size    bigint,
  doc_uuid     uuid not null default uuid_generate_v4(),
  is_archived  boolean not null default false,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index repository_files_program_idx on public.repository_files (program_id);
create index repository_files_folder_idx  on public.repository_files (folder_id);
create unique index repository_files_doc_uuid_idx on public.repository_files (doc_uuid);

comment on column public.repository_files.is_archived is
  'Archived rather than deleted. These are AACCUP certificates and COPC '
  'evaluations — the record of what an institution was awarded, which should not '
  'be destroyable from a web form.';

-- ----------------------------------------------------- common documents

create table public.common_documents (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  storage_path text not null,
  file_size    bigint,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------ NDAs

create table public.ndas (
  profile_id   uuid primary key references public.profiles (id) on delete cascade,
  storage_path text not null,
  uploaded_at  timestamptz not null default now()
);

comment on table public.ndas is
  'Decision 13: per user, auto-unlock on upload. The existence of the row is the '
  'gate — there is no human verification step and no approved flag, because the '
  'owner ruled the upload itself is the undertaking.';

create or replace function public.has_nda()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.ndas n
      join public.profiles p on p.id = n.profile_id
     where n.profile_id = auth.uid()
       and p.is_active
  )
$$;

-- --------------------------------------------------------------------- RLS

alter table public.templates        enable row level security;
alter table public.repository_files enable row level security;
alter table public.common_documents enable row level security;
alter table public.ndas             enable row level security;

create policy "templates are readable by authenticated users"
  on public.templates for select to authenticated
  using (public.is_active_user());

create policy "qac manages templates"
  on public.templates for all to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- A representative sees their own programmes' repository; QAC sees all of it.
create policy "reps read their own repository"
  on public.repository_files for select to authenticated
  using (program_id in (select public.my_program_ids()));

create policy "qac reads all repositories"
  on public.repository_files for select to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- Decision 12 — both write here.
create policy "reps write their own repository"
  on public.repository_files for insert to authenticated
  with check (program_id in (select public.my_program_ids()));

create policy "qac writes any repository"
  on public.repository_files for insert to authenticated
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "reps archive their own repository files"
  on public.repository_files for update to authenticated
  using (program_id in (select public.my_program_ids()))
  with check (program_id in (select public.my_program_ids()));

create policy "qac archives any repository file"
  on public.repository_files for update to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

-- No delete policy on repository_files at all: archiving is the way out.

-- **The NDA gate.** Common documents are readable only by a user who has filed an
-- NDA. Enforced here rather than by hiding the tab, because a hidden tab is not
-- access control (§B10).
create policy "common documents need an NDA"
  on public.common_documents for select to authenticated
  using (public.has_nda());

create policy "qac manages common documents"
  on public.common_documents for all to authenticated
  using (public.auth_role() in ('qac_personnel', 'qac_admin'))
  with check (public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "users read their own nda"
  on public.ndas for select to authenticated
  using (profile_id = auth.uid() or public.auth_role() in ('qac_personnel', 'qac_admin'));

create policy "users file their own nda"
  on public.ndas for insert to authenticated
  with check (profile_id = auth.uid());

-- ----------------------------------------------------------------- buckets

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('templates',   'templates',   false, 25 * 1024 * 1024, array['application/pdf']),
  ('repository',  'repository',  false, 25 * 1024 * 1024, array['application/pdf']),
  ('common-docs', 'common-docs', false, 25 * 1024 * 1024, array['application/pdf']),
  ('ndas',        'ndas',        false, 10 * 1024 * 1024, array['application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "templates bucket readable by authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'templates' and public.is_active_user());

create policy "qac writes the templates bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'templates'
    and public.auth_role() in ('qac_personnel', 'qac_admin')
  );

create policy "repository bucket follows the file row"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'repository'
    and public.is_active_user()
    and exists (
      select 1 from public.repository_files rf where rf.storage_path = name
    )
  );

create policy "reps and qac write the repository bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'repository'
    and public.is_active_user()
    and (
      public.auth_role() in ('qac_personnel', 'qac_admin', 'program_representative')
    )
  );

-- The gate again, at the object layer. Both halves are needed: the table policy
-- stops someone listing the documents, this one stops them fetching a file whose
-- path they already know.
create policy "common-docs bucket needs an NDA"
  on storage.objects for select to authenticated
  using (bucket_id = 'common-docs' and public.has_nda());

create policy "qac writes the common-docs bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'common-docs'
    and public.auth_role() in ('qac_personnel', 'qac_admin')
  );

create policy "users read their own nda file"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ndas'
    and public.is_active_user()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.auth_role() in ('qac_personnel', 'qac_admin')
    )
  );

create policy "users upload their own nda file"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ndas'
    and public.is_active_user()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
