# Troubleshooting

Run the self-check first: `node defense/cli.mjs doctor`

| Symptom | Fix |
|---|---|
| "Docker is not running" | Open Docker Desktop, wait for "Engine running", start again. |
| Docker Desktop will not start on Windows | Enable virtualization in BIOS; install WSL2 (`wsl --install`), reboot. |
| "port is already allocated" (54321, 54322, 54324, 3000) | Another program uses it. Close it, or `defense\stop.bat`, then start again. Another Supabase project on the laptop must be stopped (`npx supabase stop` in that project). |
| First start stuck on "Pulling" | Needs internet once. Or copy `images.tar` (see README). |
| Browser shows "This site can't be reached" | Wait for the banner in the start window; check `defense/.run/next.log`. Use `http://127.0.0.1:3000`. |
| Login says invalid credentials | Password is `DefenseDemo2026!` (case sensitive). Make sure you use the exact emails in the README. |
| Login works but pages are empty / "Not started 0%" | Supabase is not fully up: `node defense/cli.mjs start` again; check `docker ps` shows `supabase_*` containers healthy. |
| Registration code never arrives | It is not emailed: open http://127.0.0.1:54324 (Mailpit). |
| Pages look unstyled / wrong fonts | Rebuild: `node defense/cli.mjs start --rebuild`. |
| Uploaded document cannot be opened | Check `supabase_storage_qacwards` is running (`docker ps`). Restore a backup if files were lost. |
| Need to go back to a known-good state | `defense\restore.bat <backup-folder>`. |
| Computer rebooted | Start Docker Desktop, then `defense\start.bat`. Data is kept. |
| Want the app on a different port | Not supported by the scripts; port 3000 must be free. |

Logs: app `defense/.run/next.log`; containers `docker logs supabase_auth_qacwards`
(also `supabase_db_qacwards`, `supabase_storage_qacwards`, `supabase_kong_qacwards`).

**Never** run `supabase db reset` or `docker volume rm` on the defense laptop
unless you intend to erase everything (restore a backup afterwards).
