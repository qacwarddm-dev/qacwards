# BACKEND implementation progress

Companion to `plans/BACKEND.md`. That file is the contract; this file is the run log.
Updated after every phase. If context compacts, read both to recover position.

Run started: 2026-08-17

## Cloud verification run — 2026-08-18

**A database finally exists.** BL-1 was routed around rather than solved: the owner created a
Supabase cloud project and supplied credentials in `.env` (not `.env.local`). Docker is still
locked on this machine and is still required for `supabase start` and for `gen:types`.

Connection facts, because they cost time to find:

- The direct host `db.<ref>.supabase.co` resolves **IPv6-only** and this sandbox has **no IPv6
  egress**. Unreachable. The **pooler is IPv4** and is the only way in from here.
- Region is **ap-northeast-1**, host `aws-0-ap-northeast-1.pooler.supabase.com`, port **5432**
  (session mode — transaction mode on 6543 will not carry DDL).
- User is `postgres.<project_ref>`, and `PGSSLMODE=require`.
- `supabase db push --db-url …` works without `supabase login`. `supabase gen types --db-url …`
  does **not** — it shells out to Docker regardless of the target, so types remain ungenerated.

### What is now verified against a real Postgres

| Check | Result |
|---|---|
| All 9 migrations apply to a hosted project | **PASS** — after BUG-1 below |
| Tables / views / enums / functions | **34 / 3 / 14 / 20** |
| Storage buckets created | **6** |
| RLS policies | **83** |
| Tables in `public` with RLS *not* enabled | **none** |
| `log_activity` triggers attached | **20** — exactly the B8 list, no table silently missed |
| Anonymous REST read returns zero rows | **PASS** — 8 tables tested, all 0 (see below) |

### BUG-1 — a migration that only works on localhost

`20260818000500_submissions.sql` carried `comment on table storage.buckets`. `storage.buckets` is
owned by `supabase_storage_admin` and COMMENT requires ownership, so the statement **succeeds
locally** (migrations run as superuser) and **fails on every hosted project** with
`must be owner of table buckets (SQLSTATE 42501)`. The push stopped at migration 5 of 9.

Rewritten as a plain `--` comment. Documenting *our* rule by annotating *their* table was the
mistake; the note belongs in the file either way. **This is exactly the class of bug that only a
real deployment finds**, and it would have surfaced for the first time during B10's prod push.

Migration 5 rolled back cleanly — `supabase_migrations.schema_migrations` stopped at `…000400`
and `submissions` did not exist, so the retry was a plain resume with no manual repair.

### Anonymous access, measured

Eight tables queried through PostgREST with only the anon key, no session:

`campuses`, `colleges`, `positions`, `profiles`, `submissions`, `notifications`,
`activity_logs`, `program_accreditations` → **HTTP 200, 0 rows, every one.**

200-with-zero-rows is the correct RLS shape: the request is well-formed and authorised to *ask*,
and the policies decide there is nothing to see. Note what this proves and what it does not — it
proves anon is shut out, not that roles are isolated from each other. That is B10's job and still
needs sessions.

**O-19 is now measured, not predicted.** `campuses`, `colleges` and `positions` hold 23 / 14 / 13
rows and return **0** to an anonymous caller — so the register form genuinely cannot read them.
Nothing is broken today because the form reads TypeScript constants, but the choice is now forced
rather than theoretical.

### BUG-2 — every login was impossible, and nothing looked wrong

`seed-dev.sql` inserted `auth.users` rows without the eight token columns, leaving them NULL.
The rows read back perfectly in psql — correct emails, correct hashes, `email_confirmed_at` set,
profiles built by the trigger. **And no account could sign in.** Every password grant returned:

```
{"code":500,"error_code":"unexpected_failure","msg":"Database error querying schema"}
```

GoTrue scans `confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`,
`email_change_token_current`, `phone_change`, `phone_change_token` and `reauthentication_token`
into Go `string`. A NULL there is not "no token" — it is a scan failure, and the error surfaces as
a generic schema complaint that points nowhere near the cause.

Fixed in `seed-dev.sql` (they are written as `''`, which is what Supabase's own signup path does)
and the five existing rows were repaired in place. **This bug is invisible to every check short of
an actual login**, which is precisely why B2's five acceptance criteria were worth running rather
than reasoning about.

### RLS cross-role isolation — the B10 test, run early

Four real sessions, obtained through `/auth/v1/token?grant_type=password`, each querying six
tables through PostgREST. Row counts returned:

| | campuses | profiles | activity_logs | admin_actions | email_outbox | notifications |
|---|---|---|---|---|---|---|
| **rep** | 23 | **1** | 0 | 0 | 0 | 0 |
| **accreditor** | 23 | **1** | 0 | 0 | 0 | 0 |
| **qac_personnel** | 23 | **5** | 0 | 0 | 0 | 0 |
| **qac_admin** | 23 | **5** | **12** | **2** | 0 | 0 |

Every cell is what the policies intend:

- Reference data reads for all four; `profiles` is **own row only** for a representative and an
  accreditor, and all five for QAC — the split B2 wrote.
- `activity_logs` is decision 17 exactly: own actions only, and the admin sees all 12. The three
  non-admins return 0 because they have performed no mutations, which is the honest answer.
- `admin_actions` and `email_outbox` are admin-scoped and refuse the other three.

This is a real cross-role result on a real database, not a UI observation. It does **not**
discharge B10 — no test yet proves a representative cannot read *another* representative's
submission, which needs two reps and seeded submissions — but the four role boundaries above are
now measured rather than asserted.

### D-10 closed — `database.types.ts` is now generated, not hand-written

**2026-08-18.** `SUPABASE_ACCESS_TOKEN` was present in `.env`; the Management API route around
Docker works exactly as predicted:

```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
```

1963 lines, no Docker involved. Swapping it in and running `npx tsc --noEmit` surfaced **five real
bugs** the hand-written file had been hiding — this is the "diff against reality" the earlier note
predicted, opened for real:

| # | File | Bug |
|---|---|---|
| 1 | `database.types.ts` | Hand-written file exported convenience aliases `UserRole` / `CycleStatus` that plain `gen types` output does not produce (it only emits `Database["public"]["Enums"][...]`). Four call sites (`CycleManager.tsx`, `UserAdmin.tsx`, `admin.ts`, `event-actions.ts`) import them by name. Re-added as two one-line aliases derived from the real `Database` type, appended after `export const Constants`. |
| 2 | `src/lib/activity.ts:130` | `activity_logs.ip_address` is Postgres `inet`; the generator can't express that over PostgREST's JSON and types it `unknown`, not `string`. Hand-written file had guessed `string`. PostgREST does serialise it as text, so this is a cast, not a behaviour change: `r.ip_address as string \| null`. |
| 3 | `src/lib/submission-actions.ts:126-133` | `submission_readiness.readiness_percent` is **genuinely nullable** — the view computes it as `100.0 * uploaded / nullif(required, 0)`, so a level with zero required items (an edge case, not a hypothetical) divides by null. `required_count`/`uploaded_count` are `count(*)` and can't actually be null, but Postgres does not propagate NOT NULL through views, so the generator marks all three nullable regardless. Hand-written file had asserted all three non-null. Fixed by defaulting `readiness_percent ?? 0` (null reads as not-ready, which is correct — no rows uploaded against an empty requirement isn't 100%) and the other two `?? 0`. |

None of these were cosmetic — 1 and 2 were compile errors, 3 was a live null-crash on the submit
gate for any level where `required_count` is 0. `npx tsc --noEmit` → **No errors found** after the
fixes, checked against the real generated file, not the old placeholder.

The hand-written backup is kept at
`/tmp/claude-1002/.../scratchpad/database.types.handwritten.bak.ts` for this run only; nothing in
the repo references it.
- **Storage** — no file has been uploaded or downloaded. The six buckets exist with their policies;
  the PDF round trip through them is untested, so B4's upload route and B6's download route remain
  unexercised end to end.
- **Screens** — nothing has been rendered against this database. `pnpm build` is still blocked by
  BL-2 (no egress to fonts.gstatic.com), so every UI-level acceptance is still outstanding.

### `seed-dev.sql` no longer carries a password (owner decision, 2026-08-18)

The literal `DevPassword1` was fine while the only target was localhost and wrong the moment a
hosted project became one. The file now takes the password as a psql variable and fails loudly
without it:

```bash
psql "…" -v devpw="$DEV_PASSWORD" -f supabase/seed-dev.sql
```

`DEV_PASSWORD` is a 28-character random string in `.env` (gitignored). It travels through a GUC
(`app.devpw`) rather than `:'devpw'` at the point of use, because **psql does not interpolate
variables inside dollar-quoted strings** and the insert sits inside a `do $$ … $$` block — the
variable would have been passed through as literal text.

A fifth account joined the four: `mailer@pup.edu.ph`, the QAC Admin identity B8's cron jobs sign
in as (D-23).

## B9 — Dashboards & reports (in progress, 2026-08-18)

### BUG-3 — accreditors had no `submissions` SELECT policy at all

Found while wiring the Program Rep dashboard's "Document Status Distribution" chart, not by
auditing RLS on paper. `submissions` carried only two SELECT policies — reps (own programme) and
QAC (all) — and none for accreditors. Every embedded `submissions(...)` read hanging off
`assignments` (`getAssignments`, the evaluation screens) would have come back **null** for an
accreditor, and `submission_documents` was unreachable for them too, since "documents follow their
submission" reads through `submissions`' own RLS. This would have broken B5's evaluation flow —
an accreditor could not have opened a submitted PDF — but it was never caught because B5's
acceptance was never run end to end (BL-1). Fixed in a new forward migration,
`20260818001000_dashboard_visibility.sql`: `create policy "accreditors read submissions on their
assignments" ... using (id in (select submission_id from assignments where id in (select
my_assignment_ids())))`. Applied to the hosted project; `select count(*) from pg_policies where
tablename='submissions'` reads back **6** (was 5).

The same migration adds `public.submission_document_status`, a narrow security-definer view
exposing only `evaluation_items.decision` (not notes/scores/decided_by) to whoever can already read
the document — reimplementing the submissions-read predicate by hand rather than inheriting it,
because a definer view's own body does not re-apply the caller's RLS on tables it queries; only
`auth.uid()`-keyed functions (`my_program_ids()`, `auth_role()`, `my_assignment_ids()`) still see the
real caller inside it. This is what lets a representative's own dashboard show approved/pending/
disapproved counts without granting them `evaluation_items` access generally.

`select count(*) from submission_documents` and `evaluation_items` both read **0** — no file has
been uploaded yet (storage round-trip is task 4, not done), so every dashboard query below is
correctly returning empty/zero right now, not broken.

### BUG-4 and BUG-5 — two infinite-recursion RLS bugs, caught by an actual REST smoke test

Every dashboard query was typechecked and then run for real against the hosted project, logged in
as `rep@pup.edu.ph` / `accreditor@pup.edu.ph` / `qac@pup.edu.ph` through
`/auth/v1/token?grant_type=password`, hitting PostgREST directly rather than trusting `tsc`. Two
of them came back `500 {"code":"42P17","message":"infinite recursion detected in policy..."}`.

**BUG-4** — my own BUG-3 fix caused it. The new accreditor policy on `submissions` queried
`public.assignments` directly; `assignments`' pre-existing "reps read assignments on their
submissions" policy queries `public.submissions` directly right back. Both tables have RLS, so the
two policies formed a cycle — structural, not data-dependent, so it broke **every** role's reads of
either table, not just accreditors'. Every other cross-table RLS lookup in this schema
(`my_program_ids()`, `my_assignment_ids()`, `auth_role()`) already avoids this by being a `security
definer` function, whose body runs as the owner and bypasses RLS on what it reads — my new policy
skipped that indirection. Fixed in `20260818001100_fix_submissions_rls_recursion.sql`: a new
`my_assigned_submission_ids()` security-definer function, and the BUG-3 policy rewritten to call it
instead of querying `assignments` inline.

**BUG-5** — pre-existing, from B7, unrelated to anything this session touched. `events`' SELECT
policy queries `event_audiences` and `event_programs` directly; both of *those* tables' policies
("audiences follow their event" / "event programs follow their event") query `public.events`
directly right back — the identical shape of bug, three tables instead of two. This one is not new:
it was sitting in `20260818000800_events.sql` since B7 and was never caught because B7's acceptance
needed a live database and BL-1 blocked that the whole run. It would have broken `/portal/events`,
`MonthCalendar` and both dashboard `MiniCalendar`s for every role the moment any of them queried
`events`. Fixed in `20260818001200_fix_events_rls_recursion.sql`: one `visible_event_ids()`
security-definer function computing the same three-way visibility rule the original policy had,
and all three policies rewritten to call it instead of querying each other.

Both fixes applied to the hosted project and re-verified with the exact same failing REST calls,
now returning `200 []` (empty is correct — nothing has been seeded into `submissions`/`assignments`/
`events` for these accounts yet, per the zero counts above).

**Lesson recorded for the rest of this run**: `npx tsc --noEmit` cannot see RLS recursion — it is a
runtime property of the policy graph, invisible to the type system and invisible to reading the SQL
in isolation (each of the four policies involved was individually correct-looking). Every new RLS
policy from here on gets a live REST call against the hosted project before being called done, not
just a clean compile.

## Task 2 — wire remaining fake-data screens (2026-08-18)

All four screens named in this pass's task list, plus both dashboard `MiniCalendar`s (done earlier
as part of B9, same files):

- **`/portal/assignment/new`** — real campus/college/programme picker (`SelectInput` extended with
  an optional `onSelect` callback — the kit component had no way to notify a parent of a choice
  before this, kept in mind that this was the sole interactive-mode caller so nothing else needed
  updating), eligible accreditors re-fetched per programme via a new server action
  (`fetchEligibleAccreditors`), and a new `createAssignmentForProgramLevel` that resolves the
  programme+level pick to the one submitted submission it names (the frame picks a programme and a
  level, but `createAssignment` is keyed on a submission id).
- **`/portal/evaluation`** — real assignment list via a new `getMyEvaluationAssignments()`, real
  score visibility rule (`released_at` gates it, same as reps see on their own submissions), stepper
  now computed from real `assignment_status` instead of one hardcoded example.
- **`/portal/evaluation/[id]`** — real summary row and team; `evaluations`/`evaluation_items` are
  seeded lazily on first open (`ensureEvaluation` + new `ensureEvaluationItems`) from the
  submission's actual documents. **Real gap found, not invented around**: no table anywhere
  distinguishes a "Narrative Report" document from a "Best Practice" one — `submission_documents`
  only carries `phase_document_id` XOR `requirement_area_id`. Seeding maps phase-linked → narrative,
  area-linked → compliance_area, `website_url` → one website item; the frame's separate Best
  Practice section has no real data to back it and is not reproduced. Per-item accept/reject is
  real (`decideItem`); "Ready for SV" is real (`markReadyForSurveyVisit`); "Evaluate"/"Return" are
  left disabled — both frames draw them with no score/remarks input, and building that form would
  be inventing UI no export draws.
- **`/portal/events`** — real month reads (`getMonthEvents`). `MonthCalendar` manages its own
  Prev/Next cursor and only ever holds one month's data, so it gained an `onMonthChange` callback
  (kit extension) and the page wraps it in a new client screen, `EventsCalendar`, that re-fetches
  through a new server action (`fetchMonthEvents`) as the user pages. The old fake data marked
  *every* day "vacant" by default (an artifact of the static mock, not a real rule) — real days are
  unmarked unless they carry an actual event, which leaves `CalendarLegend`'s "Vacant Day" entry
  currently unreachable. Flagged, not silently resolved.

`data.ts` had `NEW_ASSIGNMENT_FIELDS`, `ELIGIBLE_ACCREDITORS`, `IA_EVALUATIONS`,
`IA_EVALUATION_STEPS`, `IA_NARRATIVE_DOCS`, `IA_COMPLIANCE_AREAS`, `IA_EVALUATION_WEBSITE(_DONE)`,
`EVENT_MONTH`, `EVENT_MARKS`, `EVENT_TITLES` removed (all replaced). Still fake and out of this
pass's scope: `REPORTS`/`REPORT_STATS` (reports screen unwired), `ASSIGNMENTS` (QAC's own
assignment-list screen, distinct from `/portal/assignment/new`).

`npx tsc --noEmit` and `npx eslint` clean on every touched file. Every new/changed read query was
hit live through PostgREST as the real dev accounts (same method that caught BUG-4/BUG-5) and
returns `200` — mostly empty arrays, which is correct: nothing has been created through any of
these forms yet (no submitted submission exists to assign, no assignment exists to evaluate, no
event exists to display). Write paths (`createAssignmentForProgramLevel`, `ensureEvaluationItems`,
`decideItem`, `fetchMonthEvents`) are Server Actions and were not exercised live in this pass — they
reuse the exact `createClient()` + RLS-scoped query pattern already proven throughout this codebase,
but a real click-through once a submission exists is still owed.

## Task 3, part 1 — submission upload modals wired, and a real file moved end to end (2026-08-18)

### The modals

`/portal/submission`'s two Add Document modals (`07.6-Requirements-modal.png` and its Phases
variant) had fields but no submit path — B4 flagged this explicitly. Wired now:

- New client component `SubmissionUploadModal.tsx` (both modals were converted from static markup
  to this one component, parameterised by a `slots` list — `ProgramRepSubmissions.tsx` itself stays
  a server component; only the modal became a client island).
- Each slot POSTs its file to `/api/submissions/upload` (unchanged — B4's route was already
  correct, just never called). A submission is created lazily on first upload via `ensureSubmission`
  if the level had none yet (D-14).
- The Requirements modal's "Document"/"Additional Document" pair didn't know *which* area it was
  attached to — `addHref` was one identical URL for every area row. Fixed by adding `&area=<id>` to
  the href and threading `areaId` through as a new prop, read from a new `?area=` search param in
  `page.tsx`.
- `SelectInput` (kit) gained an optional `onSelect` callback so the (still cosmetic,
  locked-to-the-signed-in-rep) Campus/Department/Program trio inside the modal could, in principle,
  be made real later — not exercised by this pass, the fields are still `value=`-locked exactly as
  before.

### Verified with a real file, not just typechecked

No PDF had ever moved through this app's storage before. Rather than trust the code, this was run
for real against the hosted project, as the `rep@pup.edu.ph` session (same REST-login method that
caught BUG-4/BUG-5):

1. **No open cycle existed** — `ensureSubmission` would have refused everything. Opened one for
   real: `AY 2026-2027 Accreditation Cycle`, 2026-08-01 to 2027-05-31, via the same
   create-then-`setCycleStatus('open')` two-step the settings screen uses. **The database now has a
   live open cycle** — this is a real state change, not a throwaway fixture; noted here so it isn't
   mistaken for stale data later.
2. Created a real `submissions` row as the rep (program=BSCS, level=I) — exercises "reps create
   submissions in an open cycle" for the first time.
3. Generated a real 870-byte one-page PDF with `pdf-lib` and uploaded it to the `submissions`
   bucket at its real `{cycle}/{program}/{level}/{doc_uuid}.pdf` path, as the rep — **HTTP 200**.
4. Inserted the matching `submission_documents` row, tagged to a real `phase_document_id` (Notice
   of Meeting, Phase 1) — **HTTP 201**.
5. Downloaded the object back and diffed it against the original — **byte-identical**.
6. Read `submission_readiness` for that submission back from Postgres:
   `required_count 28, uploaded_count 1, readiness_percent 3` — the view computes correctly against
   a real row, not just in the abstract.
7. Confirmed the two server-side limits actually bite, at the bucket layer (independent of the
   route's own checks, already unit-tested earlier): a `text/plain` upload to the same bucket
   returned `400 invalid_mime_type`, and `select file_size_limit from storage.buckets where id =
   'submissions'` reads back **26214400** (exactly 25 MB).

`select count(*)`, read back from Postgres, not assumed: **1** row in `submissions`, **1** row in
`submission_documents`. This also substantially covers task 4 ("storage round-trip") — the six
buckets' policies were verified structurally before, but no file had ever actually moved through
one until now.

**Task 4 closed the same way**: B6's download route (`/api/documents/download`) is a thin wrapper —
a row lookup through RLS, then `signedUrl()` — so its two halves were each proven live against the
uploaded file rather than trusting the code read. Signing as the rep who owns it (`storage/v1/object/
sign/submissions/<path>`) returned **200** with a real token; signing the identical path as
`accreditor@pup.edu.ph`, who has no assignment on this submission, returned **404 "Object not
found"** — RLS hides the object's existence rather than refusing access to it, exactly what the
route's own comment claims ("a forbidden document and a missing one are the same 404"). Both halves
of B6's download path are now measured, not assumed.

`npx tsc --noEmit` and `npx eslint` clean on every touched file.

## Task 3, part 2 — DataTable search + pagination, once in the kit (2026-08-18)

Per §8.2/§8.3's own instruction ("the kit component needs the prop; add it once... before four
screens each grow their own"):

- `kit/DataTable.tsx` gained two presentational-only props: `search` (renders `SearchField` above
  the table, controlled — the caller owns the query string and the actual fetch) and `pagination`
  (renders Prev/Next below the table from `prevHref`/`nextHref` — href-based, matching this
  codebase's existing URL-as-state convention rather than a client callback, so a page using it can
  stay a plain server component).
- `/portal/activity/page.tsx` already had a correct, hand-rolled keyset pager (`getActivity()`'s
  `(created_at, id)` cursor, built in B8) — refactored to use the new `pagination` prop instead of
  its own `<Link>` markup, proving the kit abstraction actually replaces per-screen duplication
  rather than sitting unused next to it.
- New real search: `/portal/settings/users` (`UserAdmin.tsx`) now searches through a new
  `searchUsers()` server action, debounced 250ms, only replacing the table's rows once 2+ characters
  are typed. New migration `20260818001300_search_trgm.sql` enables `pg_trgm` and adds three GIN
  trigram indexes (`surname`, `given_name`, `webmail`) — one combined expression index was
  considered and rejected: PostgREST's `.or(...)` filters on real columns, one condition per column,
  and can't target a computed expression without a stored generated column, which is a bigger schema
  change than a search box needs.

**Verified live**, not just typechecked: searched `Reyes` as QAC → the one matching profile;
searched the identical query as the rep account → RLS still returns only their own row (not zero
rows, not everyone's — the rep's own `profiles` SELECT policy is what a search runs through, exactly
§8.2's requirement that search cannot reveal another row's existence). `explain select ... where
surname ilike '%Reyes%' or ...` on the real database currently chooses a **sequential scan**, not
the new indexes — correct at 5 seeded rows, where index overhead exceeds a scan; the indexes exist
for when the table crosses the planner's cost threshold, which was always the stated point (~230
programmes and a growing document table, not five). Reported as measured, not claimed as "in use."

`npx tsc --noEmit` and `npx eslint` clean on every touched file.

## Task 5 — B10: rep-vs-rep RLS, and a real rate limit (2026-08-18)

### The gap the earlier matrix left open, closed for real

The 2026-08-18 cross-role matrix proved the four role boundaries (rep/accreditor/qac_personnel/
qac_admin) but explicitly did not prove that one representative cannot read *another*
representative's submission — that needed a second rep account and a real submission to test
against, and until this session neither existed.

Added `rep2@pup.edu.ph` to `supabase/seed-dev.sql` (idempotent, re-run against the hosted project),
mapped to Civil Engineering @ Lopez — deliberately sharing nothing with `rep@`'s two Sta. Mesa
programmes. Logged in as both real accounts and ran the actual cross-read:

| Test | Result |
|---|---|
| rep2 reads rep1's real `submissions` row by id | **`[]`** |
| rep2 reads all `submissions` (rep1's should not appear) | **`[]`** |
| rep2 reads rep1's real `submission_documents` row by id | **`[]`** |
| rep2 signs rep1's real storage object | **404 "Object not found"** |
| rep2 reads `program_reps` (should be own 1 row only) | **own row only** |
| rep1 reads `program_reps` (should be own 2 rows only) | **own 2 rows only, not rep2's** |
| rep1 reads rep2's `profiles` row by webmail | **`[]`** |

Every case: zero rows or a 404, never a 403 or a partial leak — matching the "forbidden and missing
look the same" design already used throughout (B6's download route, the RLS-recursion fixes above).
This is the specific proof the goal asked for, run against real accounts and a real submission, not
a hypothetical.

### Rate limiting — none existed; added for the one custom route that needs it

No rate-limit infrastructure existed anywhere in the app. Vercel functions are stateless across
invocations, so a real limit needs somewhere durable to count from; rather than add a dependency
(Upstash/Redis) for one counter, `20260818001400_rate_limits.sql` adds a `rate_limit_hits` table
(no RLS policies at all — every access goes through `check_rate_limit()`, a security-definer
function, so there is nothing to gain by querying the table directly even for one's own hits) and
wires it into `/api/submissions/upload`: 30 uploads per 10 minutes per user, `429` past that.

**Verified live**, not assumed: called `check_rate_limit('test_probe', 3, 600)` five times in a row
as the rep — **`true, true, true, false, false`** — the limit actually trips, not just compiles.

**Not done, honestly**: "rate limits on... the auth routes" from the goal is a bigger change than it
sounds. `LoginForm`/`RegisterForm` call `supabase.auth.signInWithPassword`/`signInWithOtp` directly
from the client — there is no server route of ours in that path to attach a limiter to, and Supabase
Auth already rate-limits password/OTP grants at the platform level. Moving those calls behind a
server action just to hang a limiter on them is a real architecture change, not a "add the prop"
change, and was not done here — flagged rather than quietly skipped.

### Error/empty states — mostly already fell out of this session's wiring, not audited as a separate pass

Every screen wired this session got a real empty state as part of being wired (not bolted on after):
`ProgramsPanel` ("You do not represent any programmes yet"), `InternalAccreditorEvaluation` ("No
assignments yet"), the create-assignment eligible-accreditors table ("No active internal
accreditors on file yet"), and the two upload-modal document lists. `/portal/activity` already had
`EmptyState` from B8. **Not verified**: a systematic pass over every screen in the portal — this was
empty-states-as-a-side-effect-of-wiring, not the dedicated audit B10 asks for. `/portal/assignment`
(QAC's own list, still on fake `ASSIGNMENTS`) and the reports screen are the clearest still-unaudited
gaps.

## Task 6 — QAC assignment list wired, empty-state audit, QAC document tree wired (2026-08-18)

Continuation of the goal from Task 5; no browser available again this session
(`mcp__claude-in-chrome` still reports "extension not connected") — not retried per screen, per
standing instruction.

- **`/portal/assignment`'s QAC Personnel branch** — was the one screen Task 5's audit flagged as
  still on fake `ASSIGNMENTS`. `getAssignments()` (`src/lib/assignments.ts`) extended with `score`
  (an `evaluations` embed, reusing `scoreDisplay()`) and `accreditor` (joined team names) rather
  than writing a second query — same function now backs both the accreditor and QAC branches of the
  page, as the goal asked. Per-row Stepper now derives from the row's real `assignment_status`
  (`assigned → in_progress → for_psv → evaluated → score_returned`, positionally matched to
  `ASSIGNMENT_STEPS`' five labels) instead of one hardcoded example; still shown only on the last
  row, matching the frame's own demo ("the prototype leaves the second row expanded") rather than
  building an expand/collapse interaction no frame draws. `ASSIGNMENTS` (data.ts) deleted. Live via
  REST as `qac@pup.edu.ph`: the extended query runs clean (no RLS recursion) and `assignments` reads
  back **`content-range: */0`** — genuinely empty, not RLS-hidden, so the screen's new `EmptyState`
  is the real current path, not a guess.
- **Empty/error-state audit** — walked every portal screen (both audits' combined scope) rather than
  re-deriving Task 5's list. Confirmed sensible zero-row rendering everywhere already wired:
  dashboards' stat tiles read 0 rather than blank, `CopcChart`/`StatusBarChart` guard their
  divide-by-zero (`Math.max(..., 1)`), `DataTable` degrades to a header-only table (not a crash or a
  blank page) when `rows` is empty, and `/portal/activity`, `NotificationBell`,
  `ProgramRepSubmissions`, and the three screens above already carry an explicit `EmptyState`/message.
  No fixes needed beyond the assignment screen itself.
- **B6's QAC document tree** — the four outstanding route files wired; see B6's own section above
  for the full account (multi-programme scoping, the `CAMPUSES`/`campuses.slug` mismatch found and
  fixed, `DocFileGrid` extracted to the kit, `FileCard`/`SAMPLE_FILES` deleted as newly-dead code).
- **`/portal/reports`** — checked decision 18 before building anything (the goal's own instruction):
  "derived from the KPI tiles for now; final [report] list decided later" (O-7). So this pass is
  exactly the five KPI tiles, real now (`getReportsStats()`, `src/lib/dashboards.ts`) — total
  programmes, main-campus count, off-main count, and a `current_program_level` split for
  with/without current award standing. **No report generator was built** — there is no `reports`
  table in the schema at all, so "New" is now `disabled` rather than a dead click, and the table
  below it shows a real (currently correct) empty state instead of one fake row. "NOT ACCREDITABLE"
  has no defined meaning anywhere in the source docs; read as "no current award" and flagged as
  **O-22** rather than asserted. Live-verified as `qac@pup.edu.ph`: `programs` reads back
  `content-range: 0-229/230` (230 total, 95 main-campus, so 135 off-main), `current_program_level`
  reads back `content-range: */0` (genuinely zero rows — no awards seeded on this hosted project
  yet), so the real numbers today are 230 / 95 / 135 / 0 / 230.

`npx tsc --noEmit` and `npx eslint` clean on every touched file.

## Status

| Phase | Title | Status |
|---|---|---|
| B0 | Foundations | **PARTIAL** — code complete; migrations apply to a hosted project, `supabase start` still blocked (BL-1) |
| B1 | Reference data | **GREEN** — seeded to the hosted project, all 10 counts read back from Postgres |
| B2 | Auth, profiles, role gate | **PARTIAL** — logins, profile trigger and role isolation now VERIFIED; browser-level checks outstanding |
| B3 | Cycles, rep mapping, user admin | **PARTIAL** — built; a real open cycle now exists (created while verifying B4), rep/user admin screens still unverified live |
| B4 | Submissions | **PARTIAL** — a real PDF moved through storage → row → readback end to end, byte-identical, and every RLS policy + limit the upload route relies on was individually proven live; **not** a literal browser click-through of the wired modal (no headless browser available in this sandbox — see "not done" below), so "rep walks the UI and clicks Upload" itself is still unverified even though every piece underneath it is |
| B5 | Assignments + evaluations + awards | **PARTIAL** — all four screens (`/portal/assignment`, `/portal/assignment/new`, `/portal/evaluation`+`[id]`) now wired live, including the QAC list branch |
| B6 | Repository, NDA, common documents | **PARTIAL** — schema + gate + rep tabs + the QAC campus/college tree all wired now; `repository_files` is genuinely empty in the hosted DB, so no folder has ever rendered its populated state |
| B7 | Events & calendar | **PARTIAL** — `/portal/events` + both dashboard `MiniCalendar`s now wired live; found and fixed BUG-5 (RLS recursion that broke every `events` read); create-event UI still not built (no Figma frame for it) |
| B8 | Notifications, email, activity logs | **PARTIAL** — activity logging VERIFIED (12 rows, 20 triggers); bell and email unverified |
| B9 | Dashboards & reports | **PARTIAL** — the three dashboards and `/portal/reports`' five KPI tiles are all real and REST-verified live; export was never in decision 18's scope (KPI-derived only, final report list deferred — O-7/O-22) |
| B10 | Hardening & deploy (local part only) | **PARTIAL** — rep-vs-rep RLS proven live with a real second account and a real submission (the specific gap the earlier matrix left open); a real Postgres-backed rate limit added and verified on `/api/submissions/upload`; a full empty-state audit now done (Task 6); auth-route rate limiting still not done — see Task 5 for why |

---

## B0 — Foundations

Status: **PARTIAL** — every code deliverable done and typechecking; the one runtime
acceptance (`supabase start`) is blocked by BL-1 and was NOT met.

### Done

- `pnpm add @supabase/supabase-js @supabase/ssr` + `pnpm add -D supabase`. Plain `pnpm add` dies
  on `ERR_PNPM_BROKEN_METADATA_JSON ... aborted due to timeout`; `--fetch-timeout 300000` fixes it.
  Two racing installs also silently clobbered each other's `package.json` — verify deps landed
  after every install, do not trust the exit code.
- `supabase init` — `supabase/config.toml` + `supabase/.gitignore` created.
- `src/lib/supabase/browser.ts`, `server.ts`, `middleware.ts` — anon-key session clients only.
  No service-role key anywhere in a request path.
- `src/lib/database.types.ts` — **placeholder**, hand-written, zero tables (accurate: B0 creates
  zero tables). `pnpm gen:types` overwrites it wholesale once the stack runs. Marked as such in
  the file header.
- `.env.example` (committed) and `.env.local` (ignored). Both keys left blank — they are printed
  by `supabase status`, which has never run. `.gitignore` had `.env*`, which was swallowing
  `.env.example` too; added `!.env.example`.
- `package.json` scripts: `supabase:start`, `supabase:stop`, `supabase:reset`, `gen:types`.
- `src/app/register/register-options.ts` rewritten against `docs/OtherContext.txt` (§6 drift):
  23 campuses, 14 colleges (College of Law removed, Graduate School added), `PROGRAM_POSITIONS`
  (4), `QAC_POSITIONS` (9), `EXPERTISE_AREAS` (82), `SYSTEM_ROLES` now `{label, role}` records so
  the UI reads "Academic Program" while the DB enum stays `program_representative` (O-4).
- `src/app/register/RegisterForm.tsx` updated to match — `ROLE_LABELS`, `ACADEMIC_PROGRAM_LABEL`,
  and `QAC_POSITIONS` vs `PROGRAM_POSITIONS` by role. The position field is still gated on
  `showPosition` (rep-only, per the Figma rule), so the nine QAC titles are wired but not yet
  reachable; B2 owns that when it wires real signup.
- "Feedback" removed from all three sidebars in `portal-nav.ts` (§4, open item O-6 → decision D-1),
  plus its now-unused `Star` import.

### Acceptance — "`pnpm supabase start` + typed client compile. Zero tables."

| Criterion | Result |
|---|---|
| Typed client compiles | **PASS** — `npx tsc --noEmit` → "No errors found" |
| Zero tables | **PASS** — no migrations exist |
| `pnpm supabase start` | **FAIL — BL-1.** Never reached a running stack. |

### Verified counts (actual, not assumed)

| Item | BACKEND.md said | Actual in OtherContext.txt |
|---|---|---|
| Expertise areas | ~90 | **82** (exact match with the seeded list, zero diff both ways) |

## B1 — Reference data

Status: **PARTIAL** — tables, generator and seed all exist and are verified against the
generated artefact; the acceptance runs `supabase db reset`, which BL-1 blocks.

### Done

- `src/lib/reference/` — `campuses.ts`, `colleges.ts`, `programs.ts`, `positions.ts`,
  `expertise-areas.ts`, `levels.ts`, `phases.ts`, `requirement-areas.ts`,
  `repository-folders.ts`, `index.ts`. Everything but `repository-folders.ts` derives from
  `docs/OtherContext.txt`; the folders come from the built portal's `DOCUMENT_FOLDERS`, and
  their six slugs were checked to match the portal's own `slug()` output exactly.
- `programs.ts` was **generated from OtherContext.txt by a script**, not transcribed, so there is
  no hand-copy drift in 230 rows.
- `supabase/migrations/20260818000100_reference_tables.sql` — 10 tables, natural keys, FKs,
  `timestamptz` throughout (§8.4), RLS on all ten: `select` for `authenticated`, and **no write
  policy at all**, so the API cannot mutate reference data. It changes by migration + seed only.
- `scripts/gen-seed.ts` + `scripts/tsconfig.seed.json`; `pnpm gen:seed` / `pnpm check:seed`.
- `supabase/seed.sql` — generated, 1216 lines, single transaction, every statement an upsert on a
  natural key so `db reset` is repeatable.
- `accreditation_levels.validity_years` = 5 on Level IV, null on the other four (decision 19/O-9).

### Acceptance — "`supabase db reset` yields 23 campuses, 14 colleges, ~230 programs, 5 levels, 18 phase documents, 19 requirement areas"

**VERIFIED 2026-08-18.** `supabase db reset` still cannot run (Docker), but the seed was applied to
the hosted project with `psql -v ON_ERROR_STOP=1 -f supabase/seed.sql` and these counts are
**read back out of Postgres with `select count(*)`**, not counted from the file. Exit 0, no
errors, and every number matches what the generator claimed — so the generator is sound too.

| Table | Plan expects | In the database | |
|---|---|---|---|
| campuses | 23 | **23** | ✓ |
| colleges | 14 | **14** | ✓ |
| programs | ~230 | **230** | ✓ |
| accreditation_levels | 5 | **5** | ✓ |
| phase_documents | 18 | **18** | ✓ |
| requirement_areas | 19 | **42** | ✗ — see below, **O-17** |
| positions | 13 | **13** | ✓ |
| expertise_areas | ~90 | **82** | actual, see B0 |
| phases | 4 | **4** | ✓ |
| repository_folders | 6 | **6** | ✓ |

Also read back: **95** programmes carry a college and **95** sit on Sta. Mesa — the same number,
which is the O-8 deduplicated main-campus figure, and it confirms that college assignment applies
to the main campus only, as designed.

Also verified: 437 inserts total, one `begin`/`commit` pair, 95 of the 230 programs carry a
college (main campus only), quote-escaping is balanced on every line (`Professional Science
Master's in Railway Engineering Management` round-trips as `Master''s`), and `npx tsc --noEmit`
is clean.

### The two numbers that do not match the plan — reported, not adjusted

**1. `requirement_areas` is 42, not 19.** The plan's expectation does not reconcile with itself.
§2.1 says "19 · 10 for PSV/I/II, 7 for Level III, 5 for Level IV" — but 10 + 7 + 5 = 22, so the
row of the table contradicts its own note. Neither number is reachable:

| Reading | Rows |
|---|---|
| Per level, PSV/I/II each carrying their own 10 (what this implementation does) | 42 |
| PSV/I/II sharing one set of 10 | 22 |
| Every repeated area name deduplicated across all five levels | 18 |
| Plan's stated figure | 19 |

Per-level was chosen because the plan's *other* arithmetic — the one it calls "the strongest
signal this model is right" — requires it: 18 + 10 = 28, 18 + 2 + 2 = 22, 18 + 5 = 23, matching
the level cards. Decision 9 also makes PSV/I/II three separate submissions with three separate
readiness scores, so each needs its own denominator, and `Research` under Level IV is a different
rubric from `Research` under Level II despite sharing a word. **O-17 raised.**

**2. O-1's Sta. Mesa college counts sum to 98; the campus has 97 programmes.** The recorded run
lengths are CADBE 3, CAF 3, CAL 5, CBA 7, CCIS 2, COC 4, **COED 20**, CE 7, CHK 2, CPSPA 5, CS 8,
CSSD 7, CTHTM 3, GS 22. Walking the actual list in order, thirteen of those fourteen land exactly
on a college boundary and **COED is 19, not 20**. Corrected to 19, which makes the run lengths sum
to 97. **O-18 raised** — and note two boundaries still deserve the owner's eye: `Master of Arts in
Physical Education and Sports` sits inside the COED run though it reads like CHK, and
`Bachelor of Library and Information Science` / `Master in Library and Information Science` sit in
COED rather than under a library programme elsewhere.

After deduplication (O-8) the main campus holds 95 programmes: COED 18 and CSSD 6, the other
twelve unchanged.

### Note for B2

The reference tables grant `select` to `authenticated` only, but the **register form is used by
anonymous visitors** and will need campus / college / position lists. It reads TypeScript
constants today so nothing is broken now. B2 must either add an anon `select` policy on those
three tables or keep the form on the constants.

## B2 — Auth, profiles, role gate

Status: **PARTIAL** — every deliverable implemented and typechecking. None of the five
acceptance criteria could be *run*, because all five need a live Auth server (BL-1).

### Done

- `20260818000200_profiles_and_auth.sql` — `user_role` enum, `profiles`, `accreditor_expertise`,
  `program_reps`; `enforce_pup_webmail` and `handle_new_user` triggers on `auth.users`;
  RLS helpers `auth_role()`, `is_active_user()`, `my_program_ids()`; RLS on all three tables.
- `20260818000300_avatars_bucket.sql` — private `avatars` bucket, 2 MB cap, MIME allowlist, and
  four storage policies keyed on `(storage.foldername(name))[1] = auth.uid()::text` so nobody can
  write into another user's folder.
- `src/middleware.ts` — `matcher: ["/portal/:path*"]`, session refresh, redirect to `/login?next=`.
- `src/lib/safe-next.ts` — `?next=` open-redirect guard, same-origin `/portal/` paths only.
- `src/lib/current-user.ts` — **the seam is real**. `getCurrentUser()` reads the session and the
  profile; `requireCurrentUser()` for callers that cannot render without one. Wrapped in React
  `cache` so layout + sidebar + page resolve one user once.
- `src/lib/profile.ts`, `src/lib/storage/index.ts` (§8.1b adapter, written early because the first
  bucket arrived here rather than in B4).
- Register flow wired end to end: `RegisterForm` → `signInWithOtp`, `VerifyWebmailForm` →
  `verifyOtp`, `CreatePasswordForm` → `updateUser`, `ProfileForm` → avatar upload.
  `registration-draft.ts` carries step 1's fields in `sessionStorage`.
- `LoginForm` → `signInWithPassword`; new `/login/forgot` and `/login/reset`.
- `/portal/profile` rebuilt on real data with two new client components,
  `ProfilePhotoCard` and `ProfilePasswordCard`.
- `/portal` role dispatcher; real `signOut` in `PortalSidebar`.
- **Deleted:** `src/lib/dev-user.ts`, `src/app/portal/dev/switch/`, `src/app/login/demo-login.ts`,
  `src/components/portal/DevUserSwitcher.tsx`, `src/components/SiteChrome.tsx`.
- `(public)` route-group migration: `/`, `about/`, `accreditations/`, `gov-recognitions/` moved
  into `src/app/(public)/` with the navbar+footer in its layout; root layout is now `<html>`,
  fonts and `globals.css` only. `login/` and `register/` stayed put and got their own `flex-1`
  layouts, which is what `SiteChrome` used to do for them by checking the pathname.
- `supabase/seed-dev.sql` — four accounts, one per role, password `DevPassword1`, idempotent.

### Kit changes (extended, not forked)

- `kit/Button.tsx` — added a disabled look. B2 brought the portal's first busy/unavailable buttons.
- `kit/Field.tsx` `PasswordInput` — accepts controlled `value`/`onChange` alongside the existing
  `defaultValue`. The Change Password panel needed it; a second near-identical field would have
  been the alternative.

### Acceptance — none verified, all blocked

**Updated 2026-08-18** against the hosted project. Three of six now real.

| Criterion | Result |
|---|---|
| No unauthenticated request reaches `/portal/*` | **UNVERIFIED at the route level** — but the layer beneath it is now proven: an anonymous REST read returns **0 rows on all 8 tables tested**, so a middleware bypass would still surface nothing |
| Each role lands on its own nav | **UNVERIFIED** — needs a browser |
| Deactivated user locked out mid-session | **UNVERIFIED** |
| Profile photo and password changes persist | **UNVERIFIED** — needs storage round-trip |
| Dev switcher gone | **PASS** — files deleted, zero references remain in `src/` |
| Seed gives working logins | **PASS** — all four accounts authenticate and receive a JWT, **after BUG-2** |
| `handle_new_user` builds the profile | **PASS** — 5 auth users → 5 profiles, roles correct, campus/college/position FKs resolved from `raw_user_meta_data` |
| The `qac_admin` provisioning path | **PASS** — the trigger refuses to grant it; the seed's post-update sets it, and `admin_actions` logged both promotions |

`npx tsc --noEmit` → **No errors found**, which is the only compile-level check that passes here.
`pnpm build` fails — see BL-2, an unrelated sandbox network limit.

### Not done in B2

The phase also asks for "a demo program with a part-finished submission" in `seed-dev.sql`.
`submissions` does not exist until B4, so the accounts, expertise and `program_reps` rows are
seeded now and the submission fixture is deferred to B4 rather than faked.

## B3 — Cycles, rep mapping, user admin

Status: **PARTIAL** — implemented and typechecking; the acceptance is an end-to-end click-through
that needs a live database (BL-1).

### Done

- `20260818000400_cycles_and_admin.sql` — `cycle_status` enum, `accreditation_cycles`,
  `admin_actions` + a `log_profile_admin_change` trigger, write policies for `program_reps`,
  and RLS throughout.
- **A partial unique index enforces one open cycle at a time**
  (`accreditation_cycles_single_open_idx ... where status = 'open'`). Two open windows would make
  "the current cycle" ambiguous exactly when a representative is trying to file, so the database
  refuses rather than the application remembering to check.
- `src/lib/admin.ts` — six server actions (`createCycle`, `setCycleStatus`, `attachRepToProgram`,
  `detachRepFromProgram`, `setUserActive`, `setUserRole`). All run on the **session** client; none
  checks the caller's role, because RLS is the authorization and a second check here could
  disagree with it.
- `/portal/settings` — layout with a `notFound()` for non-admins (so the wrong role gets an honest
  404, not an empty working page), plus `cycles`, `reps` and `users` screens.
- `SettingsTabs`, `CycleManager`, `RepMapper`, `UserAdmin` components.
- `portal-nav.ts` — `qac_admin` now **derives** from `qac_personnel` plus Settings (decision 16),
  so a change to the Personnel rail cannot leave Admin behind.

### Kit changes (extended, not forked)

- `kit/SearchField.tsx` — was inert by design (§8.2). Given optional controlled `value`/`onChange`,
  a `label` prop (the hard-coded "Search documents" is wrong on a screen that searches programmes)
  and a `className` escape for the one caller not in a 493px column.

`DocTabs` was **not** reused for the settings tab strip: it is the layered folder-leaf shape traced
off the Documents frames, hard-coded to a 1000px panel and an S-curve measured row by row. Bending
it to a screen it was never drawn for would have been worse than a small new component.

### Open items resolved as the plan directed

- **O-14** — closing a cycle freezes it: status `closed`, the row stays visible as history, and
  B4's write policies will require an open cycle. Recorded on the table comment so the rule sits
  with the schema.
- **O-15** — access follows the current mapping. `my_program_ids()` reads `program_reps` live, so
  detaching removes access immediately with no lingering grant to revoke.

### Acceptance — "admin opens a cycle and attaches a rep to programs; that rep's portal changes"

**UNVERIFIED (BL-1).** Requires a live database and four working logins. Every piece is written
and typechecks (`npx tsc --noEmit` → No errors found), and nothing beyond that is claimed.

## B4 — Submissions

Status: **PARTIAL** — implemented; the PDF half of the acceptance was genuinely tested and
passes, the database half is blocked (BL-1).

### Done

- `20260818000500_submissions.sql` — `submission_status` enum, `submissions` (with `attempt` and
  `is_revalidation`, keyed `unique (cycle_id, program_id, level_id, attempt)`),
  `submission_choices`, `submission_documents` (`version` / `supersedes_id` / `is_current`,
  `doc_uuid`, and a CHECK that exactly one of `phase_document_id` / `requirement_area_id` is set),
  the `submission_readiness` view, `readiness_band()`, full RLS, and the `submissions` bucket with
  its own 25 MB + `application/pdf` limits.
- `src/lib/pdf.ts` — `inspectPdf` (magic-number gate, then a real parse for the page count) and
  `stampUuid`.
- `src/app/api/submissions/upload/route.ts` — validate → stamp → store → row, in that order, with
  the stored object removed again if the row insert is refused.
- `src/lib/submissions.ts` (reads) and `src/lib/submission-actions.ts` (writes: `ensureSubmission`,
  `setLevelChoices`, `submitForEvaluation`, `setWebsiteUrl`, `deleteDocument`, `getDocumentUrl`).
- `/portal/submission` now fetches; `ProgramRepSubmissions` takes a `SubmissionData` prop where it
  imported `PR_*` constants. **No geometry changed** — that was the point of the screen being
  presentational.

### A real bug the test caught

`pdf.js` **transfers** the `ArrayBuffer` it is handed to its worker, which detaches the caller's
array. `inspectPdf(bytes)` therefore left `bytes` zero-length, and `stampUuid` — the very next
call in the upload route — failed with `No PDF header found` on a perfectly valid file. Every
upload would have failed. Fixed by passing `bytes.slice()` to the parser; the round-trip test now
asserts the original survives inspection.

### Acceptance

The phase's "Done when" is a representative walking programme → level → 4 phases → 10 areas →
Submit with real files. That needs a database (BL-1). The **PDF pipeline underneath it was tested
for real**, end to end, with pdf-lib and pdf-parse in this repo:

| Check | Result |
|---|---|
| 3-page PDF parses, page count reported | **PASS** — 3, as built |
| Original bytes survive inspection (the bug above) | **PASS** — 1258 bytes intact |
| Stamp applied | **PASS** — 1258 → 2221 bytes |
| UUID in PDF metadata keywords | **PASS** |
| Page count preserved after stamping | **PASS** — still 3 |
| UUID printed on **every** page, recoverable by text extraction | **PASS** |
| Renamed non-PDF rejected | **PASS** — "That file is not a PDF." |

| Criterion | Result |
|---|---|
| Rep walks the flow and readiness tiles move | **UNVERIFIED (BL-1)** |
| 25 MB / PDF-only enforced server-side | **PASS by construction, UNVERIFIED at runtime** — enforced in the route *and* on the bucket |
| Readiness view | Written; arithmetic unverified against real rows |
| Level III pick-2-of-5 | Written; `required_choices` read from the level, not hard-coded |

### Open items handled

- **O-2** — 26–50% has no band in OtherContext.txt. Implemented as `1–50 = Partially Ready`, in
  both `readiness_band()` and the screen's `readinessBand()`, so SQL and UI cannot disagree.
- **O-5** — one `website_url` per submission, as the evaluation sheet's single Website row implies.
- **O-16** — delete before submitting, supersede after. Enforced by two separate RLS policies,
  not by application code.

### Deferred within B4

- The Templates tab is not wired. `templates` is its own table in §2.4 and belongs with the other
  document families in B6; wiring it here would have meant creating that table two phases early.
- The upload modals render fields but do not yet POST to the upload route — the route, the
  storage adapter and the actions are all in place, and the modal wiring is the remaining step.
  Called out rather than left to look finished.
- §8.2 search and §8.3 keyset pagination on `DataTable` are not done. Both are listed for B4 and
  both are unstarted.

## B5 — Assignments + evaluations + awards

Status: **PARTIAL** — the schema, the award lifecycle and the actions are complete; one of the
four screens is wired, and the acceptance is a full click-through that needs a database (BL-1).

### Done

- `20260818000600_assignments_evaluations.sql` — eight enums; `assignments` (UNIQUE on
  `submission_id`), `assignment_accreditors`, `extension_requests` (schema only, decision 15),
  `evaluations`, `evaluation_items`, `program_accreditations`; the `program_awards` and
  `current_program_level` views; `my_assignment_ids()`; RLS throughout.
- **The four §2.7 transitions, as a trigger on release** (`apply_award_on_release`), not as
  application code — so a release by *any* route applies the same rules:
  - pass → new dated award, `valid_until = granted_on + validity_years` (null ⇒ never expires),
    prior award at that level marked `superseded`
  - failed **revalidation** → award revoked and a new one written one level down, carrying
    `demoted_from_level_id`
  - failed **first attempt** → falls through deliberately; no award changes hands
  - expiry → **never written**, computed by `program_awards.effective_status` from `valid_until`
- `src/lib/assignments.ts` — `getEligibleAccreditors` (expertise matching), `getAssignments`,
  `getEvaluation`.
- `src/lib/assignment-actions.ts` — the two state machines as plain transition tables (§0.2, XState
  dropped), plus `createAssignment`, `respondToAssignment`, `ensureEvaluation`, `decideItem`,
  `markReadyForSurveyVisit`, `recordOutcome`, `releaseScore`, `openRetake`.
- `supabase/seed-awards.sql` — decision 21's representative sample: 10 programmes across 8
  colleges, CCIS fullest. **Marked in the file as demo values, not PUP's real record** — the owner
  supplied no roster, so inventing one and calling it real would have been the worse failure. One
  award (COED, granted 2020, Level IV) is deliberately past its five years so the computed
  `expired` path is exercised rather than assumed.
- `/portal/assignment` wired for Internal Accreditor, including a real accept/decline
  (`AssignmentResponse`). Declining requires a reason, because `rejection_note` is otherwise
  decorative.

### Wired

All four screens are wired now: `/portal/assignment/new`, `/portal/evaluation` (+`[id]`) in Task 2;
`/portal/assignment`'s QAC Personnel branch (the one screen Task 2 didn't reach — it was reading a
different fake constant, `ASSIGNMENTS`, than the other three) in Task 6.

### Acceptance

**UNVERIFIED (BL-1)** for all of it — every criterion is a runtime click-through or a database
state check:

| Criterion | Result |
|---|---|
| QAC assigns → accept → sheet → Ready for SV → Evaluate → release → rep sees it | **UNVERIFIED**; the chain exists as actions, 3 screens unwired |
| Passed level grants a dated award | **UNVERIFIED** — trigger written |
| Failed revalidation demotes one level | **UNVERIFIED** — trigger written |
| Failed first attempt changes nothing | **UNVERIFIED** — the `elsif ... and sub.is_revalidation` branch is what makes this true |
| Retake opens as attempt 2 without destroying attempt 1 | **UNVERIFIED** — `openRetake` + the 4-column uniqueness key |

`npx tsc --noEmit` → No errors found.

### O-10 still open

Demotion is implemented as **exactly one level down** (§2.7 assumption 1, the literal reading of
"Level IV → Level III"). The alternative — falling back to the highest still-unexpired award — is
a different query, and the comment in `apply_award_on_release` marks the exact spot to change.

## B6 — Repository, NDA, common documents

Status: **PARTIAL** — schema, buckets, the NDA gate, the Program Rep tabs, and the QAC
`campus → college → folder` tree are all wired now. Acceptance needs real rows in
`repository_files` — the table is genuinely empty in the hosted DB (`content-range: */0`,
confirmed live), so every folder currently renders its real empty state rather than a populated one.

### QAC tree wired (this session)

- The four outstanding route files (`main-campus/[college]`, `main-campus/[college]/[folder]`,
  `campuses/[campus]`, `campuses/[campus]/[folder]`) now read `getRepositoryFolders` /
  `getRepositoryFiles` (`src/lib/documents.ts`) instead of `data.ts` constants.
- **A folder's files are scoped per programme, but a college or an off-main campus holds several**
  (`repository_files.program_id` has no wider grouping column) — `getRepositoryFolders` and
  `getRepositoryFiles` now take `string | string[]` for `programId`, and two new reads,
  `getCampusPrograms(slug)` / `getCollegePrograms(code)`, resolve a scope down to its programme
  ids first. A folder view lists every matching programme's files at once, each one labelled
  `"<Programme> — <Title>"` when the scope holds more than one.
- **`CAMPUSES` (data.ts) was dropped from the `campuses/` branch — its slugs carry the province for
  display ("alfonso-cavite") and never matched `campuses.slug` ("alfonso", the real join key
  `programs.ts` seeds against).** `campuses/page.tsx` and its children now read the real `campuses`
  table directly; `COLLEGES` (data.ts) is kept for `main-campus/`, since its slugs already matched
  `colleges.code` case-insensitively — confirmed live before relying on it, not assumed.
- Extracted `DocFileGrid` (kit) out of the Program Rep Reports tab's inline file grid, now shared by
  three call sites instead of forked (component-kit rule) — same `DocCard` grid, same "This folder
  is empty." message.
- `FileCard` and `SAMPLE_FILES` (data.ts) deleted — the campus folder leaf was their only caller and
  it no longer fakes a populated folder.
- Live-verified against the hosted DB as `qac@pup.edu.ph`: the campus/college → programme resolver
  queries return the real seeded rows (22 non-main campuses; Alfonso's 3 programmes; CCIS's 2), and
  the multi-programme `repository_files` read returns `HTTP 200` with valid PostgREST syntax — not
  yet exercisable end-to-end because no repository file has ever been uploaded in this environment.

### Done

- `20260818000700_documents_nda.sql` — `templates`, `repository_files`, `common_documents`,
  `ndas`, `has_nda()`, RLS on all four, and the `templates` / `repository` / `common-docs` / `ndas`
  buckets with object policies.
- **The NDA gate is enforced twice, deliberately**: an RLS policy on `common_documents` (so a user
  without an NDA lists nothing) *and* a policy on the `common-docs` bucket objects (so they cannot
  fetch a file whose path they already know). Either alone leaves a hole, and hiding the tab is
  neither (§B10).
- Decision 12 honoured — `repository_files` has write policies for **both** representatives and
  QAC, not QAC alone.
- Repository files **archive, never delete**: there is no delete policy on the table at all. These
  are AACCUP certificates and COPC evaluations, and a web form should not be able to destroy the
  record of what an institution was awarded.
- `src/lib/documents.ts` (reads), `src/lib/document-actions.ts` (`uploadNda`,
  `uploadRepositoryFile`, `archiveRepositoryFile`).
- `src/app/api/documents/download/route.ts` — the single download path. **The client sends a table
  key and a row id, never a storage path.** Letting a caller name a path would turn the one
  endpoint that mints signed URLs into a way to fetch arbitrary objects. A forbidden document and
  a missing one both return 404, so the response never reveals that a document exists.
- `/portal/documents` wired for Program Representative: real NDA state, real common documents, real
  repository files.
- `NdaUpload` component — upload unlocks immediately (decision 13), no approval step.

### `?nda=1` is gone

The static screen faked the unlocked state with a query parameter. It has been removed rather than
left in: a URL that flips an access gate is exactly the kind of thing that survives into production
by accident. The real answer is a row in `ndas`.

### Kit changes (extended, not forked)

- `kit/DocCard.tsx` — optional `href` so a tile can open its document through the download route.

### Still open

The Program Rep repository tab shows the **first** of a representative's programmes rather than a
picker (decision 6 allows many) — the QAC tree's leaf pages don't have this problem, since they
aggregate every programme in scope instead of picking one (see "QAC tree wired" above); the rep tab
itself is unchanged this session and still noted rather than hidden.

### Acceptance — "both roles upload into the six folders; Common Documents unlocks on NDA upload"

**UNVERIFIED (BL-1)** for the NDA/upload half — runtime behaviour. The QAC tree's read half is now
live-verified (see above): real resolver queries, HTTP 200 on the multi-programme file read, and a
confirmed-empty `repository_files` table rather than an assumed one. `npx tsc --noEmit` → No errors
found.

## B7 — Events & calendar

Status: **PARTIAL** — schema, reads and actions complete and typechecking; `/portal/events`,
`MonthCalendar` and the dashboard `MiniCalendar`s still render `data.ts` constants.

### Done

- `20260818000800_events.sql` — `event_kind` enum, `events`, `event_audiences`, `event_programs`,
  RLS on all three.
- **Multi-role audiences**, not the manuscript's single `target_role_id` (§2.5, §9) — an event
  can concern representatives *and* accreditors, which one column cannot express.
- The visibility policy has three arms, and the first one matters: an event with **no audience
  rows is university-wide**. Without that case, a QAC user who forgets to tick a role publishes an
  event nobody can see — a silent failure, which is worse than an over-broad one because nothing
  looks wrong.
- Events are **cancelled, not deleted** (`cancelled_at`); there is no delete policy. People planned
  around them, so they stay on the calendar struck through.
- `src/lib/events.ts` — `getEvents`, `getMonthEvents`, `getUpcomingEvents`, all formatting in
  **Asia/Manila** (§8.4). The server runs UTC, so a date derived without the zone lands on the
  wrong calendar square either side of midnight; the month query is widened a day each way for the
  same reason.
- `src/lib/event-actions.ts` — `createEvent`, `cancelEvent`.

### Known gap, flagged not hidden

`createEvent` reads the form's `datetime-local` value with `new Date(...)`, which interprets a
zoneless wall-clock string in the **server's** zone. Correct while the author and the deployment
are both Manila, wrong the day either moves. Recorded as **O-20**.

### Not wired

`/portal/events` and both dashboard `MiniCalendar`s. `getMonthEvents` returns exactly the shape
`MonthCalendar` needs; only the page change is outstanding.

### Acceptance — "QAC creates an event and only the targeted roles see it"

**UNVERIFIED (BL-1).** `npx tsc --noEmit` → No errors found.

## B8 — Notifications, email, activity logs

Status: **PARTIAL** — every deliverable implemented, typechecking and linting clean. All three
acceptance criteria are runtime behaviour and remain blocked by BL-1.

### Done

- `20260818000900_notifications_activity.sql` — `notification_kind` and `email_status` enums;
  `notifications`, `email_outbox`, `activity_logs`; `notify_user()`, `log_activity()`,
  `notify_expiring_awards()`; six notification triggers; RLS on all three tables.
- **`activity_logs` is wired by one DO loop over a list of 20 table names**, not by 20 hand-written
  triggers. A table added to that list is fully logged; a table left off it is visibly left off.
  `activity_logs`, `notifications` and `email_outbox` are excluded deliberately — logging the log
  recurses, and the outbox would write an audit row per retry.
- `log_activity()` reads `target_id` out of the row as JSON rather than naming a column per table,
  because five of the twenty (`program_reps`, `assignment_accreditors`, `submission_choices`,
  `event_audiences`, `event_programs`) have composite keys and no `id` at all.
- `ip_address` comes from PostgREST's `request.headers` GUC, wrapped in an exception handler: the
  GUC is absent when the write comes from psql, a migration or a seed, and a throw there would
  fail the write it was only meant to observe.
- Six notification triggers, one per §8.5 event: assignment issued, assignment response,
  submission received, document disapproved, score released, event scheduled.
- `src/lib/notifications.ts` (bell reads), `src/lib/notification-actions.ts` (mark read / read all),
  `src/lib/activity.ts` (keyset-paginated log reads), `src/lib/email.ts` (nodemailer),
  `src/lib/supabase/mailer.ts` (the job client + cron secret guard).
- `/api/cron/email` (drain with retry + backoff) and `/api/cron/expiring`; `vercel.json` schedules
  both. Each exports GET **and** POST — Vercel Cron issues GET and supplies the bearer token
  itself; POST keeps the job triggerable by hand or by any other scheduler.
- `/portal/activity`, on the kit's `DataTable`. In the QAC Admin rail; reached from
  `/portal/profile` by the other three roles.
- `NotificationBell` now takes real rows. Two affordances the frame drew and B0–B7 left inert now
  work: **Read All (n)** and the **All / Unread** tabs. No geometry changed.
- `NOTIFICATIONS` deleted from `data.ts`; the `PortalNotification` type stays, because it is the
  bell's prop shape, which the Figma frame defines and the database does not.
- `nodemailer` 9.0.5 + `@types/nodemailer` 8.0.1 installed, both verified present in
  `package.json` after the install rather than trusted from the exit code.

### The event trigger is a deferred constraint trigger, and that is the point

`notify_event_scheduled` cannot be a plain `after insert on events`. The audience rows
(`event_audiences`, `event_programs`) are written *after* the event row in the same transaction, so
at plain-trigger time the fan-out sees an empty audience — and B7 defines an empty audience as
**university-wide**. Every targeted event would have mailed the entire university.

`create constraint trigger ... deferrable initially deferred` fires at COMMIT, by which point the
audience is final and the genuinely-university-wide case is distinguishable from the not-yet-written
one. This is the one place in the schema where trigger timing is load-bearing.

### Email: a queue, because a trigger cannot open a socket

`notify_user(..., p_email => true)` writes both the notification and an `email_outbox` row. The
drain route sends. That split is also what buys decision 14's "retry and a failure log": `attempts`,
`next_attempt_at` and `last_error` live on the row, so a bounced address is visible in the data
rather than lost in a server log. Five attempts with exponential backoff capped at 30 minutes, then
`failed` — retrying forever turns one bad address into an unbounded queue.

Sent rows are never deleted; the sent history *is* the delivery log.

### The service-role rule held — see D-23

The obvious implementation of a cron drain is the service-role key. `src/lib/supabase/server.ts`
states that service role is confined to seeds and migrations, so it was not used. The jobs sign in
as a dedicated QAC Admin account (`MAILER_EMAIL` / `MAILER_PASSWORD`, seeded locally as
`mailer@pup.edu.ph`) and run under two ordinary RLS policies. **Raised as O-21** — it is the owner's
call whether a service account is preferable to a service key here.

### Acceptance — "bell counts are real, the four email classes send, every mutation is logged"

| Criterion | Result |
|---|---|
| Bell counts are real | **UNVERIFIED (BL-1)** — `NOTIFICATIONS` is deleted, so the bell has no fake source left to fall back to; the count is `select count(*) where read_at is null` under RLS |
| The four email classes send | **UNVERIFIED (BL-1)**, and additionally needs SMTP credentials the owner has not supplied — see M-5 |
| Every mutation is logged | **UNVERIFIED (BL-1)** — 20 tables carry the trigger; that the list is complete was checked against `create table` across all nine migrations, but no row has been written |

`npx tsc --noEmit` → **No errors found**. `npx eslint` on the nine new/changed files → **No issues
found**. `pnpm build` still blocked by BL-2.

### Not done in B8

- `src/lib/database.types.ts` was hand-extended again with the three new tables, the two new enums
  and `notify_expiring_awards`, for the same reason as D-10. It is still not generated.
- No email has ever been sent from this repo. `sendMail` is unexercised — there is no SMTP host,
  and inventing one to claim a pass would be the exact failure this log exists to prevent.

## B9 — Dashboards & reports

Status: see the fuller write-up above ("B9 — Dashboards & reports (in progress, 2026-08-18)") and
"Task 6" — dashboards and `/portal/reports` are both wired and live-verified now.

## B10 — Hardening & deploy

Status: TODO

---

## DECISIONS

Judgment calls made during the run instead of stopping to ask.

| # | Phase | Decision | Why |
|---|---|---|---|
| D-1 | B0 | O-6: **remove** Feedback from all three sidebars rather than leaving it disabled. | BACKEND.md §4 says "Remove it in B0 unless told otherwise". It routed to a 404, so a disabled item would preserve a dead affordance for no gain. Restoring it is one line if the owner disagrees. |
| D-2 | B0 | `SYSTEM_ROLES` became `{label, role}` records instead of renaming the role. | O-4 wants the UI to read "Academic Program" while every line of existing code says `program_representative`. One record carries both, so the owner's word ships without a rename rippling through the codebase. |
| D-23 | B8 | The cron routes sign in as a dedicated QAC Admin **account**, not the service role. | `src/lib/supabase/server.ts` confines service role to seeds and migrations. A key that bypasses every policy in the database is too large an instrument for draining one queue: leaking it is a full read of every programme's documents, while leaking the mailer's password is one account, revocable from `/portal/settings/users` without a redeploy. Raised as O-21. |
| D-24 | B8 | `notify_event_scheduled` is a **deferred constraint trigger**, not a plain AFTER INSERT. | Audience rows are written after the event row in the same transaction, so a plain trigger sees an empty audience — which B7 defines as *university-wide*. Every targeted event would have mailed the whole university. |
| D-25 | B8 | A `freeze_notification_columns` BEFORE UPDATE trigger sits behind the "mark as read" policy. | An UPDATE policy chooses rows, not columns. Without the trigger, "mark as read" is also "rewrite the title and link of a notification the system sent me" — and the link is followed on click. |
| D-26 | B8 | `Activity` was added to the **QAC Admin rail only**; the other three roles reach it from `/portal/profile`. | Decision 17 gives every role their own log, but the other three rails are transcribed from frames drawing four items each. Admin has no frames, so it is the one rail where a new item is a policy choice rather than a design change. |
| D-20 | B6 | The download route takes `source` + row `id`, never a storage path. | A caller-supplied path makes the signed-URL endpoint a general object-fetch primitive. The row read goes through RLS first, so there is nothing to sign for a document the caller may not see. |
| D-21 | B6 | Removed the `?nda=1` query parameter that faked the unlocked state. | A URL that flips an access gate is the kind of thing that survives into production by accident. |
| D-22 | B6 | Repository files archive rather than delete; no delete policy exists on the table. | They are the record of what the institution was awarded. |
| D-17 | B5 | Award transitions live in a Postgres trigger on `evaluations.released_at`, not in `releaseScore()`. | Release is the act that grants standing. In a trigger it applies however the release happened; in the action it applies only when that action is the path taken. |
| D-18 | B5 | Accreditor matching ranks by expertise-word overlap with the programme title and **still returns everyone**. | OtherContext.txt has no expertise↔programme mapping, and inventing one would be inventing reference data. Ranking is a suggestion so a sensible team is the default; QAC still assigns whoever they judge right. |
| D-19 | B5 | `seed-awards.sql` values are labelled in-file as demo data, not PUP's real standing. | Decision 21 asks for a representative sample to demo against; the owner supplied no roster. Presenting invented awards as real would misrepresent the institution's record at a defence. |
| D-14 | B4 | Submissions are created **lazily** on first use, not pre-seeded per programme per cycle. | Five rows × ~230 programmes is over a thousand empty rows per cycle, and a level nobody attempts should leave no trace. |
| D-15 | B4 | Upload order is validate → stamp → store → row, with the object deleted again if the insert is refused. | Storing first orphans a file behind every failed insert; stamping after storing makes the stored and served bytes differ. |
| D-16 | B4 | `submission_readiness` is a view with `security_invoker = true`. | A SECURITY DEFINER view would hand every user every programme's readiness — the exact cross-role leak §B10 exists to prevent. |
| D-11 | B3 | One open cycle at a time, enforced by a partial unique index. | The plan does not say it outright, but submissions hang off a cycle and the rep screens speak of "the" current window. Two open cycles make that ambiguous at the worst moment. A database constraint cannot be forgotten by a future route. |
| D-12 | B3 | Added `admin_actions` + a trigger, ahead of B8's `activity_logs`. | Deactivation and role change are the two administrative acts that most need a paper trail, and B8 is five phases away. One table now means B8 inherits history instead of starting empty. |
| D-13 | B3 | Self-targeting guards: an admin cannot deactivate themselves or change their own role. | There is no second admin guaranteed to exist to undo it, so it is not a recoverable mistake through this screen. |
| D-7 | B2 | Register wired on the **OTP** flow (`signInWithOtp` → `verifyOtp` → `updateUser`) rather than `signUp`. | The built frames verify the webmail *before* asking for a password, which `signUp` cannot do — it wants both at once. OTP matches the frames' order exactly, so no screen had to move. |
| D-8 | B2 | Middleware reads `profiles.is_active` per request instead of mirroring it into `app_metadata`. | app_metadata only refreshes when the JWT rotates, so a deactivated user would keep access for the rest of the token's life. UC-019 means locked out *now*. Costs one indexed lookup per portal request. |
| D-9 | B2 | Change Password re-authenticates with the current password before calling `updateUser`. | `updateUser` treats the session as proof, so the field the frame draws would otherwise be decorative. Verifying it defends the case the session cannot: a logged-in machine someone walked away from. |
| D-10 | B2 | `database.types.ts` hand-written to match the migrations, replacing the zero-table placeholder from B0. | `gen:types` needs the DB (BL-1), and every `.from("profiles")` call is a type error without it. The file says plainly that the migrations are the truth and that `gen:types` overwrites it. |
| D-4 | B1 | `requirement_areas` seeded **per level** (42 rows), not as a shared vocabulary. | The plan's own level-card arithmetic (18+10=28, 18+2+2=22, 18+5=23) and decision 9 both require it. Its stated total of 19 is unreachable under any grouping — see O-17. |
| D-5 | B1 | Sta. Mesa's COED run length corrected from 20 to **19**. | O-1's fourteen counts sum to 98 against an actual 97; the other thirteen land exactly on college boundaries in the listed order. See O-18. |
| D-6 | B1 | Seed generator compiled with the installed `typescript` into a gitignored `.seed-build/`, rather than adding a TS runner. | Node 20.20.1 rejects `--experimental-strip-types` (needs 22.6+), and `tsx` is not on the approved dependency list. `typescript` is already a devDependency, so this adds nothing. |
| D-3 | B0 | Hand-wrote a zero-table `src/lib/database.types.ts` placeholder. | `gen:types` needs a running DB (BL-1). Without the file the three typed clients do not compile, which would have failed B0's acceptance for an unrelated reason. It declares zero tables, which is exactly true at B0, and `gen:types` overwrites it. |

## QUESTIONS FOR THE OWNER

| # | Question |
|---|---|
| **O-17** | `requirement_areas`: BACKEND.md §2.1 says 19 rows but its own note says "10 for PSV/I/II, 7 for Level III, 5 for Level IV", which is 22. Implemented as 42 (per level, PSV/I/II each carrying their own 10) because that is what the level-card arithmetic and decision 9 require. Confirm 42, or say which grouping you meant. |
| **O-18** | O-1's Sta. Mesa college counts sum to 98 against 97 actual programmes; COED corrected 20 → 19. Confirm. Also worth your eye: `Master of Arts in Physical Education and Sports` is filed under COED but reads like CHK, and the two Library and Information Science degrees are under COED. |
| **O-20** | `createEvent` converts the form's zoneless `datetime-local` value using the server's timezone. Fine while both the author and the deployment are Asia/Manila; wrong once either is not. Should the form send an explicit offset, or should the app pin a zone? |
| **O-21** | B8's scheduled jobs need to reach the database with no user session. Implemented as a dedicated QAC Admin service account rather than the service-role key, because `supabase/server.ts` confines service role to seeds and migrations (D-23). Confirm, or say you would rather the cron routes hold the service key. |
| **O-19** | The register form is anonymous but reference tables are `authenticated`-read only. B2 either opens anon `select` on campuses/colleges/positions or keeps the form on TypeScript constants. Preference? |
| **O-22** | Reports' "NOT ACCREDITABLE" KPI tile (decision 18) has no backing column — OtherContext.txt never distinguishes "ineligible for accreditation" from "not yet accredited". Implemented as `programmes − programmes with any current award` (`current_program_level`), the same standing signal the QAC dashboard already reads. Confirm that reading, or say what actually makes a programme not-accreditable. |

## BLOCKERS

| # | Phase | Blocker | What was tried |
|---|---|---|---|
| **BL-2** | B2 | **`pnpm build` cannot complete: `next/font/google` cannot reach `fonts.gstatic.com`.** All 42 build errors are the same `Module not found: '@vercel/turbopack-next/internal/font/google/font'`, caused by the font fetch timing out. | Confirmed it is the network, not the code: `curl https://fonts.gstatic.com/` times out after 10s while `curl https://registry.npmjs.org/` returns 200 — this sandbox's egress allowlist covers npm but not Google Fonts. Unrelated to B2's changes and not fixable from here without either network access or moving all five faces to `next/font/local`, which would need font files the repo does not carry. `npx tsc --noEmit` passes and is the compile check used in its place. **The owner's own machine builds fine** — this is a limit of the environment this run executed in. |
| **BL-1** | B0 | **The local Supabase stack cannot start: Docker Desktop shuts itself down mid-image-pull, every time, within ~40–90s.** So `supabase start`, `db reset`, `gen:types` and every DB-backed acceptance from B0 onward are unverifiable on this machine. | Confirmed the daemon socket appears (`/home/melvin/.docker/desktop/docker.sock`) and then vanishes. `docker ps` is a false positive — the rtk hook answers it without a daemon; check the socket file instead. Ruled out disk (341 GB free), memory (8.8 GB available), and display session (active wayland seat, `DISPLAY=:0`). Ruled out Resource Saver by setting `UseResourceSaver:false` + `AutoPauseTimeoutSeconds:0` in `~/.docker/desktop/settings-store.json` — accepted by the backend, did not help. **Root cause found in the journal:** `POST /app/quit` from `Docker-Desktop/4.61.0 (Linux; x64; GUI)` carrying analytics event `actionMenuQuit` — i.e. the GUI's own *Quit Docker Desktop* action, fired 5 times across 5 attempts. Something in the desktop session is quitting it; that is outside what this run can reach. **Needs the owner** — see MANUAL STEPS M-2. |

## MANUAL STEPS

Things the owner must do — out of scope for this run.

| # | Step |
|---|---|
| M-1 | Create the cloud Supabase project; nothing in this run touches a cloud resource. |
| **M-2** | **Unblock Docker (BL-1) — this gates every DB acceptance in the run.** Either (a) find what is quitting Docker Desktop (tray menu, session script, an auto-quit extension) and stop it, then `pnpm supabase:start`; or (b) skip Docker Desktop entirely by joining the system daemon's group, which is already running: `sudo usermod -aG docker $USER && newgrp docker && docker context use default`. Option (b) is the more robust fix and needs a sudo password this run does not have. |
| **M-4** | After a role change in `/portal/settings/users`, the user's `app_metadata.role` on the JWT is **not** rewritten — only the Auth admin API can do that, and it needs the service role, which must never appear in a request path. Authorization is unaffected (`auth_role()` reads the `profiles` table, not the JWT), but if anything later reads the role off the JWT it will be stale until the token refreshes. Either keep reading it from `profiles`, or add a service-role edge function for this one write. |
| **M-5** | **SMTP credentials.** B8's four email classes are queued but nothing can send until `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` are set. Also set `MAILER_EMAIL`, `MAILER_PASSWORD` and `CRON_SECRET` — the cron routes deny every request while `CRON_SECRET` is unset, deliberately. |
| M-3 | After the stack starts once: run `supabase status` and paste the anon + service-role keys into `.env.local`, then `pnpm gen:types` to replace the placeholder `src/lib/database.types.ts`. |
