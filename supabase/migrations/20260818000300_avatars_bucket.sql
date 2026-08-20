-- B2 — the avatars bucket.
--
-- Only this one bucket lands here; the other six arrive with the phases that
-- write to them (submissions in B4, repository/common-docs/ndas in B6, reports in
-- B9), because a bucket with no writer and no policy is just an unguarded door.
--
-- Private, like every bucket in this system (plans/BACKEND.md §2.8). Avatars are
-- readable by any signed-in user — the top bar draws colleagues' faces — but
-- reads still go through a signed URL rather than a public one, so an avatar URL
-- cannot be handed to someone with no account.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2 * 1024 * 1024,   -- 2 MB; a profile photo has no business being larger
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The path is `{profile_id}/avatar.ext`, so the owner check is a comparison
-- against the first path segment. That is what confines a write to the user's own
-- folder — without it any signed-in user could overwrite anyone's photo.

create policy "avatars are readable by authenticated users"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_active_user());

create policy "users write their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and public.is_active_user()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users replace their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_active_user()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and public.is_active_user()
    and (storage.foldername(name))[1] = auth.uid()::text
  );
