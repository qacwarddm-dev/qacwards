# Continue brief — B8 close-out, B10, deploy

Read with `plans/BACKEND.md` (contract), `plans/BACKEND-RESUME.md` and `plans/BACKEND-PROGRESS.md`
(run log — read this first, it has DECISIONS/BLOCKERS/QUESTIONS tables and per-phase status) and
`.claude/session-state.md` before starting.

Finish the remaining work in `plans/BACKEND.md` for the QAC Wards capstone project. This is a
capstone system: it must be **fully functionally working for a live defense**, not
production-hardened. Do not gold-plate — skip anything whose only payoff is enterprise-grade
robustness.

The project is already wired to a real hosted Supabase project (`.env` has real URL, anon key,
service-role key, SMTP creds, MAILER_EMAIL/PASSWORD, and CRON_SECRET already set — verify they're
still valid, don't assume). B0–B7 are built and mostly live-verified via REST. B9 (dashboards +
reports) is wired and live-verified. What's left: B8 verification + one architecture change, B10,
and deploy.

## Owner decisions, already made — do not re-ask

- **O-17**: `requirement_areas` stays at 42 rows (seeded per-level: 10+10+10+7+5). Confirmed correct.
- **O-18**: Sta. Mesa COED correction (20→19) confirmed correct, including the two odd-looking
  placements (MA in PE & Sports, the two Library/Info Science degrees staying under COED).
- **O-19**: Open anon `SELECT` on `campuses`/`colleges`/`positions` so the register form reads
  live DB instead of duplicated TS constants. Add the RLS policy in a new migration.
- **O-20**: Pin the app to Asia/Manila for event datetime handling (matches §8.4's existing
  display rule) — do not build multi-timezone support.
- **O-21**: Keep the dedicated QAC Admin service account (`mailer@pup.edu.ph`) for cron auth, not
  the service-role key. This is already implemented (`src/lib/supabase/mailer.ts`) — don't change it.
- **O-22**: Keep "NOT ACCREDITABLE" KPI tile as `programs − programs with any current award`
  (via `current_program_level`). Confirmed correct, no change needed.
- **M-5**: SMTP creds are in `.env` already — verify they work, don't ask for new ones.

## Cron/email architecture change — do this before verifying B8

Vercel's free Hobby plan only allows cron jobs to run **once per day** — the existing
`vercel.json` schedules `/api/cron/email` at `*/10 * * * *`, which Hobby will reject or silently
collapse. Decision: **stay on Hobby, don't upgrade to Pro, don't add an external scheduler.**

1. In `vercel.json`, change `/api/cron/email`'s schedule from `*/10 * * * *` to once daily, at a
   different minute than `/api/cron/expiring` (e.g. `0 2 * * *` for email, keep `0 1 * * *` for
   expiring). This becomes a safety-net sweep, not the primary delivery path — daily latency for
   automatic delivery is an acceptable, explicit capstone limitation.
2. Refactor the drain logic currently inline in `src/app/api/cron/email/route.ts`'s `drain()`
   function into a shared function (e.g. `src/lib/mailer-drain.ts`) that both the cron route and a
   new manual trigger can call — don't duplicate the batching/backoff/retry logic.
3. Add a **"Send queued emails now" action**, QAC Admin only, in `/portal/settings` (a button next
   to the existing admin actions — follow the kit conventions already used on that screen; check
   `src/components/portal/kit/index.ts` before building anything new). This calls the shared drain
   function as a server action — no HTTP round-trip to the cron route needed, no `CRON_SECRET`
   involved (it's an authenticated admin action, not the cron endpoint). This is what makes the
   email pipeline demonstrably live at the defense: click it, watch `email_outbox` rows flip to
   `sent`, watch the email arrive.
4. Do **not** attempt fire-and-forget sending from inside the ~20 tables' worth of notification
   triggers or their calling routes — that would mean auditing every mutating route by hand and
   working against §8.5's whole point (a trigger can't be forgotten by a future route handler).
   The daily sweep + manual button is the intentional design; don't second-guess it further.

## Verify B8 live (currently all UNVERIFIED per BACKEND-PROGRESS.md)

- Bell counts are real: `select count(*) where read_at is null` under RLS, per role.
- All four email classes actually send with the real SMTP creds in `.env` — trigger one of each
  (account+password, assignment lifecycle, submission lifecycle, event notice) and confirm arrival,
  not just an `email_outbox` row.
- Every mutation is logged: spot-check a handful of the 20 tables carrying the `activity_logs`
  trigger, not all 20 exhaustively.
- Confirm `CRON_SECRET` actually gates the cron routes (a request without it should 404, per the
  existing `cronAuthorized` check).

## B10 — capstone-scoped, not full production hardening

Do:
- **RLS test suite** — per role, per table, prove a cross-role read returns zero rows. This is the
  one thing a defense panel will actually poke at. Use whatever test runner the repo already has
  wired (check `package.json`); if none is committed for this, a plain script hitting REST with
  each role's session client and asserting empty results is sufficient — doesn't need to be
  elaborate.
- Confirm the rate-limit table/function added earlier this run (see BACKEND-PROGRESS.md) is
  actually wired to the upload and auth-adjacent routes it was meant for, not just migrated and
  unused.
- Empty/error states — spot-check the screens most likely to be empty at a fresh defense demo
  (reports, activity log for a brand-new user), not an exhaustive audit of every screen.

Skip: CI migration pipelines, zero-downtime deploy concerns, elaborate load/rate-limit tuning.
None of that serves "works at the defense."

## Deploy

- Confirm (or create) one Vercel project pointed at this repo, connected to the existing hosted
  Supabase project — do not create a second Supabase project.
- Paste the working `.env` values into the Vercel project's environment variables dashboard
  directly (not into a CI secrets store — there's no CI pipeline here by design).
- Deploy, then smoke-test the production URL: login as each of the four seeded roles, confirm the
  dashboard loads, confirm one write path per role (e.g. rep uploads a doc, QAC creates an event).
- `next/font/google` failed to build in the sandbox that did prior sessions' work (BL-2, a network
  egress limitation of that sandbox, not a code problem) — confirm it builds clean in this
  environment/on Vercel; if it doesn't, that's a real bug now, not BL-2 again.

## Browser click-throughs

Prior sessions never had `mcp__claude-in-chrome` connected ("extension not connected"). Try it
again first. If it's available now, click through each role's main flows for real instead of
verifying via REST only. If still unavailable, keep verifying via REST/SQL as before and say so
plainly in the run log rather than claiming a click-through that didn't happen.

## Things not to undo (carried forward from BACKEND-RESUME.md)

- `src/lib/database.types.ts` is hand-written and says so in its own header — don't treat it as
  generated unless you actually ran `pnpm gen:types` against the real hosted DB this session. If you
  do regen it, the `UserRole`/`CycleStatus` aliases at the bottom get wiped — re-add them (see the
  file's own tail for what they looked like).
- `supabase/seed.sql` is generated from `src/lib/reference/*.ts` via `pnpm gen:seed` — never
  hand-edit it. `pnpm check:seed` fails CI-equivalent checks on drift.
- `supabase/seed-awards.sql` is labelled in-file as demo data, not PUP's real accreditation record
  — keep that comment, don't let it get described as a production roster anywhere (UI copy, docs,
  or the defense itself).
- No service-role key in any request path, ever. Every action/route uses the session client. RLS
  is the authorization; a route-level role check could only disagree with it.

## Success criteria — this plan is done when

- [ ] `vercel.json` has both cron jobs on daily schedules only (no sub-daily), and each fits
      Hobby's once-per-day limit.
- [ ] Drain logic lives in one shared function; the cron route and the manual admin action both
      call it — no duplicated batching/backoff/retry code.
- [ ] QAC Admin can click "Send queued emails now" in `/portal/settings` and watch pending
      `email_outbox` rows flip to `sent` in real time.
- [ ] All four email classes (account+password, assignment lifecycle, submission lifecycle, event
      notice) have each been triggered at least once and the email actually arrived — not just
      queued.
- [ ] Bell unread counts are confirmed real (not fake data) for at least one account per role.
- [ ] Spot-checked mutations show up in `activity_logs` with the correct actor and target.
- [ ] A cron request without `CRON_SECRET` gets a 404 from both `/api/cron/email` and
      `/api/cron/expiring`.
- [ ] RLS test suite exists and passes: for every role × every table it covers, a cross-role read
      returns zero rows.
- [ ] Rate limiting is confirmed wired (not just migrated) on the upload and auth-adjacent routes
      it was built for.
- [ ] Reports and activity-log screens show correct empty states for a freshly seeded account —
      no fake/placeholder data leaking through.
- [ ] One Vercel project is live, pointed at the existing hosted Supabase project, with `.env`
      values set in its dashboard.
- [ ] Production build succeeds (no BL-2 font-fetch failure) and the deployed URL loads.
- [ ] On the production URL: all four seeded roles can log in, land on their own dashboard, and
      each completes at least one real write (rep uploads a doc, QAC creates an event, etc.).
- [ ] `plans/BACKEND-PROGRESS.md` and `.claude/session-state.md` reflect everything above —
      no criterion above is true only in this session's memory and not written down.

If a criterion can't be met (e.g. browser tool still unavailable), it's recorded as a named
blocker in `BACKEND-PROGRESS.md`, not silently skipped or claimed as done.

## When done

Update `plans/BACKEND-PROGRESS.md` (append to its existing DECISIONS/BLOCKERS/QUESTIONS tables and
per-phase status, following its established format — don't restructure it) and append the relevant
new facts to `.claude/session-state.md`'s existing sections, per that file's own header instructions.
Do not rewrite either file wholesale.
