-- checkUploaded() lists the object right after the browser uploads it, before the
-- repository_files row exists. The only SELECT policy on this bucket requires
-- that row, so QAC could never see its own fresh upload and every COPC upload
-- failed with "Upload did not complete". Same shape as the common-docs bucket.
create policy "qac reads the repository bucket"
  on storage.objects for select to authenticated
  using (bucket_id = 'repository' and is_qac());
