# QAC-WARDS — offline defense setup

Runs the whole system on one laptop: the Next.js app plus a local Supabase
(Postgres, Auth, Storage, mail catcher) in Docker. No Supabase Cloud, no Vercel,
no internet during the defense.

## One-time setup (needs internet, do it days before)

1. Install **Docker Desktop** and **Node.js 22+** (https://nodejs.org, LTS).
2. Copy the project folder to the laptop (e.g. `C:\qacwards`). Do **not** copy a
   `.env` file from the developers' machines — the package must not contain one.
3. Open Docker Desktop and wait until it shows "Engine running".
4. Double-click **`defense\start.bat`** (Windows) or run **`sh defense/start.sh`**
   (macOS / Linux).

The first start downloads dependencies and Docker images, builds the app and
loads the demo data. It takes 10-20 minutes. Later starts take about a minute.

Optional, for a venue with bad Wi-Fi: on the developer machine, with the system
running, run `node defense/cli.mjs save-images`, then copy the generated `defense/images.tar` with the project. The start script
loads it instead of downloading images.

## Defense day

1. Start Docker Desktop.
2. Double-click `defense\start.bat` — the browser opens at **http://127.0.0.1:3000**.
3. When finished, double-click `defense\stop.bat`.

Always use `127.0.0.1:3000` (not `localhost`) so login cookies stay consistent.

Normal start and stop **never delete data**. Stopping keeps all accounts,
records and uploaded files in Docker volumes. Nothing in these scripts resets
the database.

## Demo accounts

Password for all of them: `DefenseDemo2026!`

| Role | Email |
|---|---|
| QAC Admin | admin@pup.edu.ph |
| QAC Personnel | qac@pup.edu.ph |
| Program Representative (CCIS, Sta. Mesa) | rep@pup.edu.ph |
| Program Representative (Engineering, Lopez) | rep2@pup.edu.ph |
| Internal Accreditor | accreditor@pup.edu.ph |
| More accreditors (for team assignment) | accreditor2@pup.edu.ph, accreditor3@pup.edu.ph, accreditor4@pup.edu.ph |

Sample records: reference data (colleges, campuses, programs, levels, phases,
requirement areas, documents), one open accreditation cycle
(AY 2026-2027) and a started Preliminary Survey Visit for the CCIS programs
(BS Information Technology, BS Computer Science). These are demonstration
records, **not** the old cloud data.

## Emails and verification codes

Nothing is sent to the internet. Every email (registration code, password reset,
notices) is caught by Mailpit: open **http://127.0.0.1:54324** to read it. When
someone registers a new account during the demo, the 6-digit code is there.

## Backup and restore

```
defense\backup.bat                    (or ./defense/backup.sh)       -> defense/backups/<timestamp>/
node defense/cli.mjs backups                                          -> list backups
defense\restore.bat <backup-folder>   (or sh defense/restore.sh <name>)
```

A backup holds the database (`db.sql`) and every uploaded file (`storage/`).
Restore asks for confirmation, takes a safety backup of the current state first,
then replaces the data. Take a backup before the defense and after you have set
up your demo scenario, so you can return to that exact state.

## Updating to a newer version (needs internet)

Your data is kept: it lives in Docker, not in the project folder. Take a backup
first if you want a safety copy.

If the folder is a git clone (it has a `.git` folder):

```
defense\stop.bat                      (or sh defense/stop.sh)
git pull
defense\start.bat --rebuild           (or sh defense/start.sh --rebuild)
```

Stop first: an older start script keeps a running app instead of replacing it.
From this version on, `start` rebuilds and restarts the app by itself when the
code changed, so plain `git pull` then `start` is enough. New database
migrations are applied automatically on start, without a reset.

If you received a zip instead, extract the new zip into a new folder and run the
same `start` command there.

## What still needs internet

- Nothing needed during the defense.
- First-time setup only: installing dependencies, pulling Docker images.
- Links to external sites (PUP website, government links in the public footer,
  `bit.ly` inquiry link printed on certificates) will not open offline.
- Emails never reach real inboxes (by design; read them in Mailpit).
- The email *templates* reference Google Fonts; in Mailpit they fall back to
  system fonts.

## Security notes

- The app listens on `127.0.0.1` only.
- The Supabase containers publish ports (54321 API, 54322 Postgres, 54324/54325
  Mailpit) on all interfaces by Docker's default. On an untrusted network keep
  the Windows firewall on (Public network profile) or disconnect from Wi-Fi.
  Supabase Studio is not started.
- The demo password is a local fixture. It protects nothing real.
- `.env.local` is generated on every start and holds only local values. The
  service-role key is never written to it and never used by the app.

See `TROUBLESHOOTING.md` if something goes wrong; `node defense/cli.mjs doctor`
runs the self-check.
