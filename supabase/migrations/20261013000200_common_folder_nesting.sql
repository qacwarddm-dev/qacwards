-- Folders inside folders. Deleting a folder removes its subfolders; documents
-- inside any of them go back to the main list (folder_id is set null).

alter table public.common_folders
  add column if not exists parent_id uuid references public.common_folders (id) on delete cascade;

create index if not exists common_folders_parent_idx on public.common_folders (parent_id);

drop index if exists public.common_folders_name_idx;
create unique index if not exists common_folders_name_idx
  on public.common_folders (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)));
