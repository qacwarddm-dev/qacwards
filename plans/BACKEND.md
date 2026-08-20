# Backend + Database Integration Plan

Status: agreed baseline · 2026-08-16 · supersedes `plans/03-auth-role-gate.md` where they disagree

Supabase (Postgres + Auth + Storage) behind the portal that is already built. The frontend is
the specification: every table below exists because a screen needs it. `docs/` is background,
not authority — where the manuscript and the built UI disagree, the UI wins.

---

## 0. Decisions locked

| # | Question | Decision |
|---|---|---|
| 1 | Account creation | **Fully self-service.** Verified `@pup.edu.ph` webmail + role picked at registration = immediate access. No admin approval gate. |
| 2 | Schema authority | **Designed fresh from the frontend.** Manuscript ERD becomes a document to update, not a constraint. |
| 3 | Scope | Everything in the manuscript **except**: Feedback (cut), System Backups (deferred, not cut — see §7). Public Information stays static. |
| 4 | Migrations | **Supabase CLI, versioned SQL in `supabase/migrations/`.** No project exists yet; owner creates the cloud project. |
| 5 | Assignment unit | **Team of accreditors per (program, level).** Not per-area, not one-to-one. |
| 6 | Rep scope | **Many programs per rep.** The same program name on a different campus is a *different* program row. |
| 7 | Public site | **Fully static for now.** Revisit later. No CMS tables. |
| 8 | Requirement checklists | Authored in TypeScript, **generated into seed SQL** (see §2.1). |
| 9 | PSV / I / II | **Same 10 Areas, submitted three times.** Three submissions, three readiness scores, three evaluations. |
| 10 | Team scoring | **One shared evaluation sheet** per assignment that any assigned accreditor may edit. |
| 11 | Cycles | **Cycles scope everything.** Submissions, assignments, evaluations all hang off a cycle. |
| 12 | Document families | Four (templates / submissions / AACCUP-COPC repository / common docs) — and **the repository is program-written too**, not QAC-only. |
| 13 | NDA gate | **Per user, auto-unlock on upload.** No human verification step. |
| 14 | Email | Account+password, assignment lifecycle, submission lifecycle, event notices. All four classes. |
| 15 | Extension requests | **Schema + API now, no screen this pass.** |
| 16 | QAC Admin | **QAC Personnel nav + a `/portal/settings` section.** Screens designed against the existing kit; no Figma exists. |
| 17 | Activity logs | **Own actions only; QAC Admin sees all.** UC-009's "all users" is read as a manuscript error. |
| 18 | Reports | Derived from the KPI tiles for now; final list decided later. |
| 19 | Cycle meaning | **Institutional window**, per the manuscript — QAC opens "AACCUP Survey Visit 2026" and submissions belong to it. Decision 11 stands. See §0.1. |
| 20 | Rep deadlines | **Yes** — QAC sets a `due_date` per submission. Drives the rep's countdown and the "DUE THIS MONTH" tile. |
| 21 | Starting awards | **Representative sample** — real standing seeded for CCIS and a few colleges to demo against; the rest start empty. Explicitly not a production roster. |
| 22 | Storage | **Free tier, demo-scale.** A handful of programs carry real PDFs; the rest hold metadata only. See §8.1. |

### 0.1 What a "cycle" is — settled 2026-08-16

The owner initially read a cycle as *"how many times this program has been accrediting for this
level."* The manuscript disagrees, and the manuscript won.

`docs/data-model.txt` Table 36 gives `accreditation_cycles` a `start_date` ("official calendar
activation date for the accreditation workflow"), an `end_date`, and a `status` covering "the
entire cycle". Table 37 calls `assignments.cycle_id` a link to the "respective **institutional
scheduling window**".

Its own example name is what caused the confusion: **"AACCUP 3rd Survey Visit 2026"** fuses two
ideas. *"3rd Survey Visit"* is per-program — this program's third attempt at this level.
*"2026"* is an institution-wide window. Both concepts are real; the manuscript named them as one.

**They are separate in this schema and always were:**

| Concept | Where it lives |
|---|---|
| Institution-wide window with dates and a status | `accreditation_cycles` |
| This program's Nth attempt at this level | `submissions.attempt` |

Nothing changed as a result of this exchange — `attempt` had already been added for retakes
(§2.7). Recorded here because the question will be asked again at the defense.

### 0.2 Stack calls (owner deferred to recommendation)

| Item | Call | Why |
|---|---|---|
| XState | **Drop** | Two state machines with ≤6 states each. A plain TS transition table plus a Postgres `CHECK` on the status column is smaller, testable, and can't drift from the DB. Reintroduce only if guards get genuinely conditional. |
| pdf-lib UUID stamping | **Keep** | It is a PRD non-functional guarantee and it earns its keep here — a printed accreditation document traces back to a row. Applies to submission uploads and repository files. |
| react-big-calendar | **Drop** | `kit/MonthCalendar.tsx` and `kit/MiniCalendar.tsx` already match the Figma. Adding the library means restyling it back into what you have. |
| pdf-parse | **Keep** | Cheap. Rejects renamed non-PDFs at the door and gives page count for free. |

---

## 1. Architecture

```
Browser ──▶ Next.js Server Component / Route Handler
                    │  (user's session client — anon key + JWT)
                    ▼
            Postgres with RLS  ◀── the real authorization boundary
                    │
            Supabase Storage (private buckets, RLS on storage.objects)
```

**Rules that don't bend:**

- Every request-path query goes through the **user's** session client. A service-role key in a
  request path is a full RLS bypass. Service role is confined to: seed scripts, migrations, and
  the nightly/edge jobs in §7.
- Role lives in `app_metadata` on the JWT, never `user_metadata` (users can edit that).
- Middleware only answers "are you signed in". Whether *this* rep may read program 999 is RLS's
  job, and the answer is zero rows → 404.
- `src/lib/current-user.ts` is the single identity seam. Only its body changes; every caller,
  prop and component stays. `src/lib/dev-user.ts` and `/portal/dev/switch` are deleted in B2.
- `src/components/portal/data.ts` is the single fake-data seam. It shrinks phase by phase and
  ends as UI-only constants.

---

## 2. Data model

### 2.1 Reference data — TS-authored, SQL-seeded

The owner's call was "hardcoded in TypeScript". Straight constants have two costs: an uploaded
file's requirement reference becomes a string with no foreign key, and readiness % can't be
aggregated in SQL (every dashboard count becomes an app-side loop per request, per program).

**The flow instead:** the TS file stays the one place a human edits, and a script generates the
seed migration from it.

```
src/lib/reference/*.ts   ← the only file anyone edits
        │  pnpm gen:seed
        ▼
supabase/seed.sql        ← generated, committed, never hand-edited
        │  supabase db reset
        ▼
Postgres reference tables ← real rows, real FKs, SQL-aggregatable
```

Same single edit point, no admin UI to build, and the DB keeps referential integrity. The
generator is ~60 lines and CI fails if `seed.sql` is stale relative to the TS.

Tables seeded this way — all from `docs/OtherContext.txt`:

| Table | Rows | Notes |
|---|---|---|
| `campuses` | 23 | `is_main` true for Sta. Mesa, Manila only |
| `colleges` | 14 | Main campus only. Includes Graduate School |
| `programs` | ~230 | `UNIQUE(campus_id, name)` — same program on two campuses = two rows |
| `positions` | 13 | `scope` ∈ `program` (4) \| `qac` (9) |
| `expertise_areas` | ~90 | Accreditor specializations |
| `accreditation_levels` | 5 | PSV, I, II, III, IV. `required_choices` int (Level III = 2) |
| `phases` | 4 | Planning / Implementation / Monitoring / Evaluation |
| `phase_documents` | 18 | 5 + 5 + 4 + 4. `is_optional` on "Site visit report (if conducted)" |
| `requirement_areas` | 19 | 10 for PSV/I/II, 7 for Level III (2 mandatory + 5 choices), 5 for Level IV |
| `repository_folders` | 6 | The AACCUP/COPC folder set |

**The arithmetic checks out**, which is the strongest signal this model is right:

| Level | Pre-accreditation | Requirements | Total | Level card says |
|---|---|---|---|---|
| PSV / I / II | 18 | 10 areas | **28** | "28 REQUIRED TEMPLATE (Each)" ✓ |
| III | 18 | 2 mandatory + 2 chosen | **22** | "22 REQUIRED TEMPLATE" ✓ |
| IV | 18 | 5 | **23** | "23 REQUIRED TEMPLATE" ✓ |

### 2.2 Identity

```
profiles              id → auth.users.id, role, surname, given_name, middle_initial,
                      campus_id?, college_id?, position_id, webmail, avatar_path,
                      is_active, created_at
accreditor_expertise  (profile_id, expertise_area_id)          -- M:N
program_reps          (profile_id, program_id)                 -- M:N, decision 6
```

`role` enum: `program_representative | internal_accreditor | qac_personnel | qac_admin`.
A trigger on `auth.users` insert creates the `profiles` row and mirrors `role` into
`app_metadata`.

### 2.3 Workflow core

```
accreditation_cycles  name, description, start_date, end_date, status, created_by

submissions           cycle_id, program_id, level_id, attempt, status, website_url,
                      is_revalidation, due_date, submitted_at
                      UNIQUE(cycle_id, program_id, level_id, attempt)
submission_choices    (submission_id, requirement_area_id)     -- Level III's 2 picks
submission_documents  submission_id, phase_document_id? | requirement_area_id?,
                      title, storage_path, file_size, page_count, doc_uuid,
                      version, supersedes_id?, is_current, uploaded_by, uploaded_at
                      CHECK (exactly one of the two refs is set)

assignments           cycle_id, submission_id, assigned_by, status, due_date
assignment_accreditors (assignment_id, profile_id, response, rejection_note, responded_at)
extension_requests    assignment_id, requested_by, original_due_date, proposed_due_date,
                      reason, status, processed_by, processed_at        -- schema only

evaluations           assignment_id UNIQUE, score numeric(5,2), outcome, compliance_status,
                      remarks, ready_for_sv_at, evaluated_at, released_at, released_by
evaluation_items      evaluation_id, kind, submission_document_id?, requirement_area_id?,
                      label, decision, score?, note, decided_by, decided_at
```

`evaluation_items.kind` ∈ `narrative | compliance_area | best_practice | website` — the four
sections of `InternalAccreditorEvaluationDetail`.

**Document review lives in exactly one place.** An earlier draft of this plan put a
`review_status` column on `submission_documents` *and* a `decision` on `evaluation_items`. That is
the same fact in two tables and they would drift the first time anyone wrote one without the
other. `evaluation_items.decision` wins — it carries who decided and when, which the column could
not — and it now FKs to `submission_document_id` so the sheet can open the PDF it is judging. A
document's status is a join, not a column.

**The revision loop** is why `supersedes_id` exists. Reject → rep is notified → rep uploads a
replacement, which inserts a new row with `version + 1`, `supersedes_id` pointing at the rejected
one, and flips the old row's `is_current` to false. The rejected file and the decision that
rejected it both survive; the accreditor sees a fresh undecided item. Nothing is overwritten,
which matters when the thing being audited is an audit system.

**Concurrency:** decision 10 put the team on one shared sheet, so two accreditors deciding the
same item is last-write-wins. Accepted deliberately — `decided_by`/`decided_at` make it visible
after the fact, and per-item granularity keeps the blast radius to one row rather than the whole
sheet. Not worth optimistic locking at this team size.

**Two state machines**, as plain TS transition tables + Postgres `CHECK`:

```
submission.status   not_started → in_progress → submitted → under_evaluation
                                → evaluated | returned

assignment.status   assigned → in_progress → for_psv → evaluated → score_returned
```

The second is exactly the 5-step `Stepper` in `ASSIGNMENT_STEPS` / `IA_EVALUATION_STEPS`.

### 2.4 Documents

```
templates          level_id?, requirement_area_id?, phase_document_id?, title, storage_path
repository_files   program_id, folder_id, title, storage_path, doc_uuid, is_archived
common_documents   title, storage_path
ndas               profile_id UNIQUE, storage_path, uploaded_at
```

NDA gate is `EXISTS (SELECT 1 FROM ndas WHERE profile_id = auth.uid())` — decision 13.

### 2.5 Supporting

```
events            cycle_id?, title, description, start_time, end_time, kind,
                  created_by, cancelled_at
event_audiences   (event_id, role)          -- multi-role; manuscript's single target_role_id
event_programs    (event_id, program_id)    -- program-scoped visits
notifications     recipient_id, kind, title, body, link, read_at, created_at
activity_logs     actor_id, action_type, target_table, target_id,
                  old_value jsonb, new_value jsonb, ip_address inet, created_at
reports           type, params jsonb, generated_by, generated_at, storage_path
```

`activity_logs` is written by **Postgres triggers**, not app code — coverage stops depending on
anyone remembering to log.

### 2.6 Readiness

A view, not a stored column:

```sql
readiness = (current documents uploaded) / (18 + area count for that level) * 100
```

Bands per `OtherContext.txt`: `0` Not Started · `1–25` Partially Ready · `51–75` Moderately
Ready · `76–99` Nearly Ready · `100` Ready for Evaluation. **See open item O-2 — 26–50% has no
band.**

### 2.7 Accreditation awards, expiry, demotion, retakes

Everything in §2.3 is work *in flight*. This section is what a program **holds** — the part the
original plan was missing entirely. Added 2026-08-16 on the owner's rule: *a Level IV program up
for revalidation that fails is demoted to Level III; Level IV is valid 5 years; a program may
retake levels it did not pass.*

```
accreditation_levels  + validity_years int?      -- Level IV = 5; others null until specified

program_accreditations  program_id, level_id, cycle_id, source_evaluation_id,
                        granted_on, valid_until, status, superseded_by,
                        demoted_from_level_id?, decided_by, decided_at
```

`status` ∈ `active | expired | superseded | revoked`. **`expired` is never written by a job** —
it is computed by a view from `valid_until < now()`, so the answer can't be stale or depend on a
cron that failed overnight. The only scheduled work is the *notification* in §3/B8 ("Level IV
expires in 6 months"), and if that job misses a night nothing is incorrect, only late.

`current_program_level` view = the highest-ordinal `active` award per program. That view is what
the public accreditation page, the QAC KPI tiles, and the COPC chart all read.

**The four transitions:**

| Event | Effect |
|---|---|
| Evaluation released with `outcome = passed` | New `program_accreditations` row, `granted_on = release date`, `valid_until = granted_on + level.validity_years` (null ⇒ no expiry). Any prior award at the same level is marked `superseded`. |
| `valid_until` passes | Award reads `expired` via the view. Program's current level falls to the next highest still-active award. |
| Revalidation submission fails (`outcome = failed`, `is_revalidation = true`) | Award at that level is closed and a new award is written **one level down**, carrying `demoted_from_level_id`. |
| First-attempt failure (`is_revalidation = false`) | **No award change.** The program keeps whatever it held; it simply hasn't gained the new level. A program that has never held Level IV cannot be demoted by failing it. |

That last row is the distinction the schema has to keep straight, and it is why `submissions`
carries `is_revalidation`: failing an attempt at a level you don't hold costs you nothing, while
failing a revalidation of a level you *do* hold costs you the level.

**Retakes** are why `submissions` gained `attempt` and its uniqueness key changed. Without it, a
second try at the same level in the same cycle violates the unique constraint. Each attempt keeps
its own documents, its own assignment and its own evaluation, so the history of a failed attempt
survives the retake instead of being overwritten.

#### Assumptions made here — correct any that are wrong

Recorded rather than asked, so nothing blocks. Each is cheap to change *now* and expensive after B5.

1. **Demotion is exactly one level down.** Literal reading of "Level IV → Level III". The
   alternative — falling back to the highest level still unexpired — is a different query and
   would need award history to resolve.
2. ~~Assumption~~ **Confirmed by owner 2026-08-16.** Only Level IV has a validity period.
   `validity_years` is null for PSV and Levels I–III, so they never expire and never trigger
   revalidation. The column exists for all five levels, so filling in real terms later is a seed
   change, not a migration.
3. **Retakes are allowed within the same cycle**, numbered by `attempt`. Nothing forces a program
   to wait for the next cycle.
4. **Demotion restarts nothing.** The demoted-to Level III award gets a fresh `granted_on` at the
   failure date but inherits Level III's `validity_years` (currently null ⇒ no expiry).
5. **Pass/fail is declared by the accreditor team on the shared sheet; QAC's release is what
   applies it.** This one is not a guess — the UI already shows Score as *"Not yet released"*,
   so release is plainly a distinct act from evaluation, and it is the natural place to write an
   award. `outcome` ∈ `passed | failed`, set on the sheet, applied on release.

### 2.8 Storage buckets

All private; downloads go through short-lived signed URLs minted server-side after an RLS check.

| Bucket | Path | Write | Read |
|---|---|---|---|
| `submissions` | `{cycle}/{program}/{level}/…` | rep on own programs | rep (own), assigned accreditors, QAC |
| `repository` | `{campus}/{college?}/{program}/{folder}/…` | rep on own programs, QAC | rep (own), QAC |
| `templates` | `{level}/…` | QAC | all authenticated |
| `common-docs` | flat | QAC | authenticated **with an NDA row** |
| `ndas` | `{profile_id}/…` | owner | owner, QAC |
| `avatars` | `{profile_id}/…` | owner | all authenticated |
| `reports` | `{year}/…` | QAC | QAC |

---

## 3. Phases

Each phase ends in something demonstrable. Nothing is "done" until its RLS test passes.

### B0 — Foundations (small)

- `supabase init`, local stack, `.env.local`, `.env.example`
- `src/lib/supabase/{browser,server,middleware}.ts` via `@supabase/ssr`
- `pnpm gen:types` → `src/lib/database.types.ts`
- Fix the reference-list drift (§6) in `register-options.ts`
- **Done when:** `pnpm supabase start` + typed client compile. Zero tables.

### B1 — Reference data

- Reference tables + `pnpm gen:seed` generator + `supabase/seed.sql`
- CI check that `seed.sql` matches the TS
- `accreditation_levels.validity_years` — 5 on Level IV, null on the other four (decision 19/O-9)
- **Done when:** `supabase db reset` yields 23 campuses, 14 colleges, ~230 programs, 5 levels,
  18 phase documents, 19 requirement areas. Verified by count assertions.

### B2 — Auth, profiles, role gate

- Supabase Auth email+password; `@pup.edu.ph` enforced at signup; email verification
- `profiles` + the `auth.users` trigger writing `app_metadata.role`
- Wire the built 4-step register flow, login, forgot password
- `src/middleware.ts`, `matcher: ["/portal/:path*"]`, session refresh, `?next=` open-redirect guard
- `(public)` route-group migration (per `plans/03-auth-role-gate.md` §Migration) — public URLs
  byte-identical afterwards
- `@pup.edu.ph` enforced by a **Postgres trigger on `auth.users`**, not a form check — a client-side
  validation is bypassed by one direct call to the Auth API
- `is_active = false` blocks login in middleware **and** is a predicate in every RLS policy.
  Decision 1 removed the approval gate; it did not remove UC-019's deactivation, and a deactivated
  user whose session is still warm must lose access on the next request, not the next login
- `/portal` role dispatcher
- **`/portal/profile`** — avatar upload/delete to the `avatars` bucket, change password via
  `supabase.auth.updateUser`. Personal details stay display-only per the owner's 2026-08-01
  revision, so this screen is two writes, not a form
- Replace `getCurrentUser()` body; **delete** `src/lib/dev-user.ts` and `/portal/dev/switch`
- **Seeded dev accounts** — one per role, plus a demo program with a part-finished submission,
  in a `supabase/seed-dev.sql` that never runs in production. Deleting the dev switcher removes
  the only way to see four roles' screens; without this, B3–B9 have nothing to develop against
- RLS helpers: `auth_role()`, `my_program_ids()`
- **Done when:** no unauthenticated request reaches `/portal/*`; each role lands on its own nav;
  a deactivated user is locked out mid-session; profile photo and password changes persist;
  dev cookie switcher is gone and `db reset` still gives four working logins.

### B3 — Cycles, rep mapping, user admin

- `accreditation_cycles` CRUD; `program_reps` mapping; activate/deactivate, role change
- New screens under `/portal/settings` (no Figma — designed against the kit, one at a time,
  screenshot-and-confirm per the phase-2 protocol)
- Add QAC Personnel nav + Settings to `qac_admin` in `portal-nav.ts` (currently empty)
- **Done when:** admin opens a cycle and attaches a rep to programs; that rep's portal changes.

### B4 — Submissions (the core vertical)

- `submissions`, `submission_documents`, `submission_choices`, `submissions` bucket
- Upload route: pdf-parse validate → pdf-lib stamp UUID → store → row
- 25 MB / PDF-only enforced server-side, not just on the input element
- Readiness view; Level III's pick-2-of-5
- Wire `/portal/submission` (all four query-param states) and the Templates tab
- **Done when:** a rep walks program → level → 4 phases → 10 areas → Submit with real files, and
  the readiness tiles move.

### B5 — Assignments + evaluations

- `assignments`, `assignment_accreditors`, `evaluations`, `evaluation_items`,
  `extension_requests` (schema only)
- Eligible-accreditor matching by `accreditor_expertise`
- Wire `/portal/assignment`, `/portal/assignment/new`, `/portal/evaluation`,
  `/portal/evaluation/[id]`, accept/reject modal
- **Award lifecycle (§2.7):** `program_accreditations`, `current_program_level` view, the four
  transitions, retake attempts, demotion on failed revalidation
- **Seed a representative sample of existing awards** (decision 21) — real standing for CCIS and
  a few other colleges so the dashboards and the public status page have something true to show
  at the defense. The rest of the ~230 programs start with no award
- **Done when:** QAC assigns a team → accreditors accept → shared sheet filled → Ready for SV →
  Evaluate → score released → rep sees it. Plus: a passed level grants a dated award; a failed
  revalidation demotes one level; a failed first attempt changes nothing; a retake opens as
  attempt 2 without destroying attempt 1.

### B6 — Repository, NDA, common documents

- `repository_files`, `common_documents`, `ndas` + buckets + signed-URL download route
- Wire the QAC `campus → college → folder` tree and all three Program Rep document tabs
- **Done when:** both roles upload into the six folders; Common Documents unlocks on NDA upload.

### B7 — Events & calendar

- `events`, `event_audiences`, `event_programs`
- Wire `/portal/events`, `MonthCalendar`, and the dashboard `MiniCalendar`s
- **Done when:** QAC creates an event and only the targeted roles see it.

### B8 — Notifications, email, activity logs

- `notifications` + `NotificationBell` wired (mark-read, unread filter)
- nodemailer + the four approved email classes (decision 14), each with a retry and a failure log
- `activity_logs` triggers on every mutating table; `/portal/activity` — own actions, admin all
- **Done when:** bell counts are real, the four email classes send, every mutation is logged.

### B9 — Dashboards & reports

- Replace remaining `data.ts` constants with queries: KPI tiles, `CopcChart`, `StatusBarChart`,
  recent uploads, ongoing accreditation, evaluation progress
- `reports` + KPI-derived generation + export
- **Done when:** `data.ts` holds only UI constants; no screen reads fake domain data.

### B10 — Hardening & deploy

- RLS test suite: per role, per table, a test proving cross-role reads return **zero rows**
- Rate limits on upload/auth routes; error and empty states on every screen
- Supabase prod project, Vercel env, migrations in CI
- **Done when:** the RLS suite is green and prod runs off the same migrations as local.

### Dependency order

```
B0 → B1 → B2 → B3 → B4 → B5 → B6 → B7 → B8 → B9 → B10
                     └──────────────┴─ B6/B7 can run parallel to B5 if needed
```

B1 precedes B2 because `profiles` has foreign keys to `campuses` / `colleges` / `positions`.
B3 precedes B4 because cycles scope submissions (decision 11).

---

## 4. Cut

**Feedback** — dropped entirely (owner, this session). It is currently a nav item in **all three**
role sidebars in `portal-nav.ts` and routes to a 404. Remove it in B0 unless told otherwise
(see open item O-6).

---

## 5. Deferred, not cut

**System Backups** (UC-022, `system_backups`). No table, no route, no job this pass. If it lands
later it is a `pg_dump` + storage-archive job on a schedule, writing one row per run. Recorded
here so it isn't quietly forgotten.

---

## 6. Reference drift to correct in B0

`docs/OtherContext.txt` is the authority. `src/app/register/register-options.ts` disagrees:

| Item | Currently in code | OtherContext.txt |
|---|---|---|
| Campuses | 15 | **23** — adds Alfonso, Bansud, Biñan, Calauan, General Luna, Maragondon, San Pedro, Sta. Rosa |
| Colleges | 14, includes **College of Law** | 14, **no College of Law**, adds **Graduate School** |
| Program positions | Dean, Associate Dean, Department Chairperson, Program Coordinator, Faculty Member, Program Representative | **Campus Director, College Dean, College Chairperson, Faculty** |
| QAC positions | none | **9 entries** |
| System role label | "Program Representative" | **"Academic Program"** |
| Expertise | free text | **~90 fixed options** |

Also: `DOC_COVER_PREVIEW` in `data.ts` lists **Mariveles** (not among the 23 — Bataan campus is
*in* Mariveles) and **ITECH** (Institute of Technology, not in the 14 colleges). Both are
transcribed from the prototype and need an owner ruling.

---

## 7. Open items

| # | Item | Blocks |
|---|---|---|
| ~~O-1~~ | **Resolved 2026-08-16, pending boundary check.** Sta. Mesa's ~97 programs are listed in exactly the order of the 14-college list, so the college mapping is recoverable from the grouping — CADBE 3, CAF 3, CAL 5, CBA 7, CCIS 2, COC 4, COED 20, CE 7, CHK 2, CPSPA 5, CS 8, CSSD 7, CTHTM 3, GS 22. Note MBA/DBA sit under CBA, MPA/DPA under CPSPA, MA Education under COED — graduate degrees are not all in Graduate School. Off-main-campus programs have no college, which the `campuses/[campus]` vs `main-campus/[college]` route split confirms. | B1 |
| O-2 | Readiness bands skip **26–50%**. Assumption unless corrected: `1–50` = Partially Ready. | B4 |
| O-3 | `phase_documents` counts "Site visit report (if conducted)" toward 18, and the level-card totals only work if it does. So it is required for the denominator but optional in practice. Confirm that's intended. | B4 |
| O-4 | System role label: DB enum stays `program_representative` (matches all existing code); UI label becomes "Academic Program" per OtherContext. Confirm. | B2 |
| O-5 | Website URL — one per `(cycle, program, level)` submission, per the evaluation sheet's single Website row. Confirm. | B4 |
| O-6 | Remove "Feedback" from all three sidebars, or leave it as a disabled item? | B0 |
| O-7 | Report list — KPI-derived for now (decision 18); final list still owed. | B9 |
| O-8 | Duplicate rows in OtherContext.txt: Sta. Mesa lists "BTLEd major in ICT" and "BA in Sociology" twice each. Deduping on seed. | B1 |
| ~~O-9~~ | **Closed 2026-08-16.** Only Level IV expires; PSV–III are permanent. `validity_years` null for the other four. | — |
| O-10 | **Demotion depth** — assumed exactly one level down (§2.7 assumption 1). If it should instead fall to the highest still-unexpired award, say so before B5. | B5 |
| ~~O-11~~ | **Closed 2026-08-16** — decision 21. Seed a representative sample: real standing for CCIS and a few colleges, rest start empty. Consistent with decision 22 (demo-scale storage). Not a production roster, and should not be described as one. | — |
| O-12 | Does a demotion or an expiry notify anyone (rep, dean, QAC), and by email or bell only? Currently folded into B8's submission-lifecycle email class. | B8 |
| ~~O-13~~ | **Closed 2026-08-16** — decision 22, free tier / demo-scale. Estimate corrected from 30 GB to ~5.6 GB per cycle (§8.1). | — |
| O-14 | **Cycle close semantics.** Still open — the question got absorbed into settling what a cycle *is* (§0.1). Now that cycles are confirmed institutional windows with an `end_date`, it needs an answer: what happens to a submission still in flight when its cycle closes? **Assumed until corrected: freeze in place, read-only** — uploads stop, the record stays visible as history, the program re-submits fresh next cycle. Nothing is lost and nothing silently continues. | B3 |
| O-15 | A rep's programs can change (`program_reps` edited in B3). Do they keep read access to submissions they filed for a program they no longer represent? Assumed **no** — access follows current mapping. | B3 |
| O-16 | Withdrawal/deletion. Can a rep delete an uploaded document before submitting, and can a submission be withdrawn after? Assumed: delete before submit, no delete after (supersede only). | B4 |

---

## 8. Cross-cutting concerns

Found in a self-audit of this plan against the built routes (2026-08-16). None of these belonged
to a single phase, which is exactly why the first draft missed them.

### 8.1 Storage capacity — settled

**Correction to an earlier draft of this section.** It sized storage as all ~230 programs
uploading a full document set at once (~30 GB) and presented that worst case as an expectation.
That is not how accreditation runs. A cycle has roughly 20–40 programs actively submitting:

```
40 programs × 28 documents × ~5 MB ≈ 5.6 GB per cycle
```

**Decision 22: Free tier, demo-scale.** A handful of programs carry real PDFs; the rest hold
metadata only. Zero cost, sufficient for the defense, and explicitly not a production
configuration — say so if asked, rather than implying the 1 GB tier would hold a real rollout.

If it ever does go into real use, Supabase Pro ($25/mo, 100 GB) covers many cycles with no
architectural change.

**The 25 MB limit must be enforced server-side.** The `accept="application/pdf"` attribute and
the "Maximum upload size of 25 MB" note in `ProgramRepSubmissions` are UI copy, not controls.

### 8.1b Storage adapter

All uploads and downloads go through **one module** (`src/lib/storage/`), not scattered
`supabase.storage.from(...)` calls. Supabase Storage is S3-compatible, so should the free tier
ever bind, moving documents to Cloudflare R2 (zero egress fees, ~$0.015/GB) becomes a driver swap
instead of a migration touching every upload route. ~40 lines of insurance, written in B4 when
the first bucket appears.

### 8.1c Why Supabase, re-checked

Asked and re-answered 2026-08-16 in light of the storage question. **Stay.**

This plan's entire authorization model is Postgres RLS — "a cross-role read returns zero rows and
a 404, never a hidden UI element" (§1, §B10). That property is enforceable *because the database
enforces it*. Leaving Supabase means rebuilding authorization in application code, which is the
single riskiest change available here, traded against a storage bill that turned out not to be a
problem.

For the record on the alternatives: Firebase is the worst fit (no SQL, no RLS — §2 would be
rewritten wholesale). AWS RDS + Cognito + S3 is more operations than this team should carry.
Neon + Clerk + R2 is three vendors doing one vendor's job. The storage adapter in §8.1b covers
the one dimension where Supabase is genuinely beatable.

### 8.2 Search and sort

`kit/SearchField.tsx`, `kit/ViewToggle.tsx` and the sort affordance in `ProgramRepDocuments` are
built and inert. UC-005 and UC-012 both require them. Not free:

- Program and document search wants `pg_trgm` GIN indexes, not `ILIKE '%…%'` — ~230 programs and
  a growing document table make sequential scans the default plan otherwise.
- Search must run **through RLS**, so a rep searching "BSIT" never learns another campus's
  document exists by its absence from results.

Lands in B4 (documents/submissions) and B9 (programs/reports).

### 8.3 Pagination

`kit/DataTable.tsx` has no pagination and every list feeding it grows: ~230 programs, ~97 in main
campus alone, assignments accumulating per cycle, activity logs unbounded. Keyset pagination
(`created_at, id`) rather than `OFFSET` — offset degrades exactly where these tables are headed.
The kit component needs the prop; add it once, in B4, before four screens each grow their own.

### 8.4 Timestamps

`timestamptz` everywhere, never bare `timestamp`. Display in `Asia/Manila`. Accreditation due
dates and event times are legally meaningful and the manuscript's `timestamp` columns would drift
the moment anything runs on a UTC server — which Vercel and Supabase both are.

### 8.5 Notification generation

Same mechanism as `activity_logs`: Postgres triggers, not application code. Every path that can
create a notification (assignment issued, document rejected, score released, event scheduled,
award expiring) is a database write anyway, and a trigger cannot be forgotten by a future route
handler. The scheduled job in B8 covers only the one case with no triggering write — an award
crossing `valid_until`.

### 8.6 Testing

`@playwright/test` and `test:visual` are already in `package.json` and pinned to the static
fake-data screens. **Those snapshots break the moment real data lands** — that is not a
regression, and treating it as one will waste a day per phase.

- Re-baseline visual tests against `seed-dev.sql`, so screenshots have deterministic data.
- The RLS suite in B10 is the one that must never be skipped: per role, per table, a test proving
  a cross-role read returns **zero rows**. UI hiding is not access control and a passing screen
  proves nothing about the policy underneath.

## 9. Manuscript reconciliation

`docs/data-model.txt` needs these edits before the capstone document is accurate again:

- `users` splits into `auth.users` (Supabase-managed) + `profiles`
- `academic_programs.user_id unique` → dropped; replaced by the `program_reps` join table
- `assignments.document_id` → `submission_id`, plus the `assignment_accreditors` join table
- New: `accreditation_levels`, `phases`, `phase_documents`, `requirement_areas`, `submissions`,
  `submission_documents`, `submission_choices`, `evaluation_items`, `program_accreditations`,
  `notifications`, `repository_files`, `common_documents`, `ndas`, `campuses`, `colleges`,
  `positions`, `expertise_areas`, `event_audiences`
- The manuscript has **no concept of a program holding a level** — no award, no validity period,
  no expiry, no demotion, no retake. §2.7 is entirely new and is the largest single gap between
  `docs/data-model.txt` and the real system.
- Removed: `feedbacks` (cut), `system_backups` (deferred)
- `events.target_role_id` → `event_audiences` (multi-role)
