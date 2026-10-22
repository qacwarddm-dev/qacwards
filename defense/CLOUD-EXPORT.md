# Moving the old Supabase Cloud data into the local database (developers only)

Not done here: the cloud project's free-tier quota is exhausted and its
credentials were not used. The demo accounts and sample records are fixtures,
**not** recovered data. If the cloud project is reachable again (or you
upgrade it temporarily), this is the read-only way to copy it. Nothing below
writes to the cloud project.

1. Get the direct database URL from the Supabase dashboard (Project Settings >
   Database). Use it only in your shell; do not commit it.
2. Dump only `public` and `auth` data (a read-only operation). Storage rows are
   left out on purpose: local files are stored under internal version ids, so
   they must be re-uploaded through the Storage API, not copied.

   ```
   pg_dump "$CLOUD_DB_URL" --data-only --disable-triggers --no-owner \
     -n public -n auth -T auth.schema_migrations > cloud.sql
   ```

3. With the local system running and *before* building the demo scenario, load
   it into the local database (this erases the demo rows first):

   ```
   docker exec -i supabase_db_qacwards psql -U supabase_admin -d postgres -c \
     "truncate table public.profiles, auth.users restart identity cascade"
   (echo "set session_replication_role = replica;"; cat cloud.sql) | \
     docker exec -i supabase_db_qacwards psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1
   ```

4. Download each bucket's files from the cloud (dashboard, or the S3-compatible
   endpoint) and upload them to the same object paths in the local Storage API
   (`http://127.0.0.1:54321/storage/v1/object/<bucket>/<path>`, service-role key
   from `npx supabase status`), and insert matching `storage.objects` rows by
   uploading through the API rather than SQL.

Do not use `defense/restore` for a cloud dump: it also empties `storage.buckets`.
The dump contains password hashes and real personal data: keep it off shared
drives. None of these steps has been run against the real cloud project.
