# Resume brief — BACKEND.md implementation run

Written at the end of the first implementation session. Read this with
`plans/BACKEND.md` (the contract) and `plans/BACKEND-PROGRESS.md` (the run log, phase by phase,
with DECISIONS / BLOCKERS / QUESTIONS / MANUAL STEPS tables).

---

## Where the run got to

**B0 → B7 attempted. All PARTIAL. Zero phases fully green.** B8, B9, B10 not started.

The repo typechecks clean (`npx tsc --noEmit` → No errors found) and every phase's *code* exists.
What almost nothing has is a **runtime acceptance**, because the local database never started.

| Phase | State |
|---|---|
| B0 Foundations | Clients, env, scripts, reference drift fixed. `supabase start` never succeeded. |
| B1 Reference data | 10 tables, `gen:seed` generator, `seed.sql` verified at 23/14/230/5/18/13/82/4/6. |
| B2 Auth & role gate | Full: profiles, triggers, RLS helpers, middleware, register/login/forgot, `(public)` migration, dev seam deleted. |
| B3 Cycles & admin | Cycles (one-open constraint), rep mapping, user admin, `/portal/settings`. |
| B4 Submissions | Schema, readiness view, RLS, upload route. **PDF pipeline tested for real, 7/7.** |
| B5 Assignments & awards | Schema, the four §2.7 transitions as a release trigger, actions. 1 of 4 screens wired. |
| B6 Documents & NDA | Four families, NDA gate at table *and* bucket, download route, rep tabs wired. |
| B7 Events | Schema, reads, actions. No screens wired. |

---

## The one thing that unblocks everything: BL-1

**The local Supabase stack never started.** Docker Desktop shuts itself down mid-image-pull,
every attempt, within 40–90 seconds.

Root cause was found, not guessed: the journal shows `POST /app/quit` from
`Docker-Desktop/4.61.0 (Linux; x64; GUI)` carrying analytics event **`actionMenuQuit`** — the
GUI's own *Quit Docker Desktop* action, fired 5 times across 5 attempts. Something in the desktop
session is quitting it.

Ruled out: disk (341 GB free), memory (8.8 GB available), display session (active wayland seat),
and Resource Saver (`UseResourceSaver:false` + `AutoPauseTimeoutSeconds:0` were written to
`~/.docker/desktop/settings-store.json` and accepted by the backend — did not help).

**Two ways out, (b) preferred:**

```bash
# (a) find what is quitting Docker Desktop (tray menu, session script, extension), then:
pnpm supabase:start

# (b) skip Docker Desktop entirely — the SYSTEM daemon is already running,
#     this user just is not in its group. Needs a sudo password.
sudo usermod -aG docker $USER && newgrp docker && docker context use default
docker ps            # should now work against /var/run/docker.sock
pnpm supabase:start
```

**Gotcha:** `docker ps` passes through the rtk proxy hook and returns a *false positive*
("[docker] 0 containers") with no daemon running. Check `ls -la ~/.docker/desktop/docker.sock`
or `docker info` instead.

### The moment it starts, in order

```bash
pnpm supabase:start
supabase status                      # paste anon + service_role keys into .env.local
pnpm gen:types                       # OVERWRITES the hand-written src/lib/database.types.ts
pnpm supabase:reset                  # runs migrations + supabase/seed.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed-dev.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/seed-awards.sql
npx tsc --noEmit                     # will surface any drift between the hand-written types and reality
```

Then re-run each phase's "Done when" from `plans/BACKEND.md` and replace every **UNVERIFIED** row
in `BACKEND-PROGRESS.md` with a real result. Expect the hand-written `database.types.ts` (D-10) to
disagree with the generated one somewhere — that diff is the highest-value bug list in the repo.

## BL-2 (environment, not code)

`pnpm build` cannot finish: `next/font/google` cannot reach `fonts.gstatic.com` from this sandbox
(confirmed — `curl` to it times out while `registry.npmjs.org` returns 200). Builds fine on a
normal network. `npx tsc --noEmit` was used as the compile check throughout.

---

## Three questions that need the owner

These were decided alone to keep moving, and each is cheap to change now and expensive later.

| # | Question | What was implemented |
|---|---|---|
| **O-17** | `requirement_areas` count. BACKEND.md §2.1 says **19**, but its own note ("10 for PSV/I/II, 7 for III, 5 for IV") totals **22**. No grouping yields 19: per-level = 42, shared = 22, fully deduplicated = 18. | **42** (per level), because the plan's level-card arithmetic (18+10=28, 18+2+2=22, 18+5=23) and decision 9 both require it. |
| **O-18** | O-1's Sta. Mesa college run lengths sum to **98** against **97** actual programmes. | **COED corrected 20 → 19**; the other thirteen land exactly on college boundaries. Also worth an eyeball: `MA in Physical Education and Sports` sits under COED but reads like CHK, and both Library and Information Science degrees are under COED. |
| **O-10** | Demotion depth on failed revalidation. | **Exactly one level down** (§2.7 assumption 1). The alternative — fall to the highest still-unexpired award — is a different query; the spot to change is commented in `apply_award_on_release`. |

Also open: **O-20** — `createEvent` converts the form's zoneless `datetime-local` using the
server's timezone. Fine while author and deployment are both Manila, wrong once either is not.

---

## Next steps, in priority order

1. **Unblock BL-1**, then run the sequence above. This converts ~30 "written but unverified" rows
   into real pass/fail and regenerates the types.
2. **B8** — notifications + activity_logs as Postgres **triggers** (§8.5: a trigger cannot be
   forgotten by a future route handler), nodemailer for the four approved email classes
   (decision 14), `/portal/activity`. `admin_actions` (added in B3) already holds role-change and
   deactivation history for it to build on.
3. **B9** — replace the last `data.ts` domain constants with queries: KPI tiles, `CopcChart`,
   `StatusBarChart`, recent uploads. `current_program_level` (B5) is the view the COPC chart and
   the KPI tiles are meant to read. Done when `data.ts` holds only UI constants.
4. **B10** — the RLS suite. **This is the one that must not be skipped**: per role, per table, a
   test proving a cross-role read returns **zero rows**. A passing screen proves nothing about the
   policy underneath. Plus rate limits on upload/auth routes and error/empty states.
5. **Wire the screens still on fake data.** Reads and actions all exist and typecheck; only page
   plumbing is left: `/portal/evaluation`, `/portal/evaluation/[id]`, `/portal/assignment/new`,
   the QAC `campus → college → folder` tree, `/portal/events`, both dashboard `MiniCalendar`s.
6. **Two smaller gaps left open on purpose:** the submission upload modals render fields but do not
   yet POST to `/api/submissions/upload`; and §8.2 search + §8.3 keyset pagination on `DataTable`
   are listed for B4 and unstarted.

---

## Things not to undo

- `src/lib/database.types.ts` is **hand-written** and says so. Do not treat it as generated until
  `pnpm gen:types` has actually run.
- `supabase/seed.sql` is generated. Edit `src/lib/reference/*.ts` and run `pnpm gen:seed`;
  `pnpm check:seed` fails CI on drift.
- `supabase/seed-awards.sql` is labelled in-file as **demo data, not PUP's real accreditation
  record**. It must not be described as a production roster.
- No service-role key in any request path. Every action and route uses the session client, and no
  action checks a role — RLS is the authorization, and a second check could only disagree with it.
- `pnpm add` needs `--fetch-timeout 300000` here, and two concurrent installs silently clobber
  `package.json`. Verify deps landed after every install.
