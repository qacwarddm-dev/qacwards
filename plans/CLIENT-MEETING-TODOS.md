# Client Meeting TODOs

Two sources, kept as separate dated sections below:
1. `design/prototype-notes.md` "Still open with the client" + flagged arbitrary values, and the
   backend open questions (O-10/O-17/O-18/O-20) in `plans/BACKEND-RESUME.md`.
2. The user's own shorthand meeting notes from **2026-09-06**, decoded against the current
   codebase. Where the note used Tagalog shorthand or a name I couldn't resolve with certainty,
   I've marked the reading as a best guess rather than silently picking one.

Go through one at a time.

## Build backlog — scope locked, not implemented yet

Everything below was decided 2026-09-13. Status as of 2026-09-18:

- [x] Program Rep Documents tab: center + shrink level labels, smaller active tab font
- [x] 2-accreditor / PSV-100%-before-Level-1 gate (`assignment-transitions.ts`)
- [x] Internal Accreditor: e-sign upload (3rd method), Discipline Expertise → real dropdown
- [x] QAC per-assignment deadline field, surfaced on the calendar
- [x] About page: SANJAY P. CLAUDIO text/photo container sizing
- [x] Navbar border/edge alignment: public (white) navbar now matches the portal (maroon) one
- [x] O-10: demotion-on-failed-revalidation logic removed (`apply_award_on_release`), migration run
- [x] O-18b: "Master of Arts in Physical Education and Sports" moved from COED to CHK
- [x] O-20: Asia/Manila hard-pinned across event datetime handling
- [ ] Survey Instrument (new feature, whole section) — still not started. **Distinct from** the QAC
      Service Evaluation shipped 2026-09-18 below: this one is filled by the accreditor on-site,
      not by the program rep rating QAC. No frames for it yet either.
- [x] QAC Events UI (Calendar + Event Schedule tabs) — shipped 2026-09-18 (later), see the section
      below. **Program Rep and Internal Accreditor still each need their own Events/Calendar
      frame** — this only covers the QAC-role screen the EVENTS folder's sidebar showed.
- [ ] Internal Accreditor Assignment/Evaluation/Events UI — still waiting on frames
      (`assets/new frames/Internal Accreditor/` arrived empty on 2026-09-18).
- [ ] QAC Admin/Personnel UI update — still waiting on frames (none arrived 2026-09-18 either).
- [ ] QAC Admin editor for Fullname/Campus/Position — net-new, backend already allows it
      (`guard_profile_privileged_columns`); no frame needed, just not built yet. Next candidate
      that doesn't require waiting on the client.
- [ ] Session Token logout bug — investigated 2026-09-13, no code gap found in `src/proxy.ts`.
      Needs **the user's own check** of the remote Supabase project's Auth session-timeout
      settings — not something further code investigation can resolve.

## 2026-09-18 — `assets/new frames/` delivered and implemented

Shipped: QAC nav widened (AACCUP & COPC / Accreditation renamed, Extension Monitoring + Feedback
added), QAC Dashboard revamp (On-Going Accreditation + Evaluation Progress tables, schedule +
calendar), Reports filter row, net-new Extension Monitoring workflow (phases, doc
approve/reject/return), net-new Feedback screen, and the net-new "QAC Service Evaluation" form
(program rep rates QAC's service, reached from the Levels list once a level hits 100%). Details
and file pointers in `.claude/session-state.md`. All presentational/fixture-backed where no table
exists yet (Extension Monitoring, Feedback) — flagged in code, not silently faked.

**Folder-naming trap found (2026-09-18), resolved same day:** the first drop of
`assets/new frames/EVENTS/` had `Event Calendar.png` and `Event Schedule.png` byte-identical to
`Feedbacks.png` (client naming slip, three copies of the Feedback export). Flagged to the client;
they re-exported the correct pair same day. Implemented: `/portal/events` (Calendar, existing
`MonthCalendar`) and new `/portal/events/schedule` (stat tiles + filter + table), switched by a new
`EventsTabs` component. Real data throughout — `getEventSchedule()` (`src/lib/events.ts`) merges
`events` and per-assignment due dates same as the calendar already did, adds a time-derived
Upcoming/Ongoing/Completed status, and pulls real participant avatars for deadline rows via
`assignment_accreditors`. This is the **QAC-role** Events screen only — Program Rep and Internal
Accreditor still need their own frame (unchanged, see below).

## 2026-09-19 meeting notes — new asks, not yet implemented

### Dashboard navigation — CONFIRMED, shipped 2026-09-19
- [x] Event Calendar (dashboard widget): a marked day (PSV/COPC) on `MiniCalendar` is now a link to
      `/portal/events/schedule` — the only screen either kind has a real per-item view on.
      `getMiniCalendarData()` (`src/lib/dashboards.ts`) returns `hrefs` alongside `marks`;
      `MiniCalendar` (`src/components/portal/kit/MiniCalendar.tsx`) renders a marked day as a `Link`
      when one is present, plain text otherwise. Deadline/holiday/other stay unmarked exactly as
      before (see that function's existing comment) — nothing to click, so no href needed for them.
- [x] Recents (dashboard widget = Program Rep's "Recent Uploads"): a row now links to the document's
      real phase/requirement-area slot on `/portal/submission` (`?view=phases` or
      `?view=requirements&area=<id>`, scoped to the right `program`/`level`). `getRepDashboard()`
      extended its `submission_documents` read with `submission_id`/`phase_document_id`/
      `requirement_area_id` to build the link (`recentUploadHref()`, `src/lib/dashboards.ts`).
      `UploadList` (kit) takes an optional `href` per row; QAC/IA dashboards have no "Recents"
      widget of their own (only Program Rep does), so this is scoped to that one screen.

### Documents — Phase 2, CONFIRMED, shipped 2026-09-19
- [x] Added **MOA (Memorandum of Agreement)** to Phase 2 (Implementation) as `phase_documents`
      ordinal 6 — migration `20260919000100_moa_phase_document.sql` (**not yet applied to the
      remote DB** — blocked by the harness's own production-deploy guard; run it yourself, see
      session note below), mirrored into `supabase/seed.sql` and `src/lib/reference/phases.ts`.
- [x] Existing docs (Notice of Meeting, Minutes of Meeting, Project Proposal, Action Plan, Budget
      Proposal — all Phase 1) are untouched, confirming this was additive.
- ⚠️ **Side effect, flagged rather than silently absorbed**: `phase_documents` is shared across
      every level (`submission_readiness`'s denominator is `count(phase_documents) + level areas`,
      not per-level), so this moves every level's required-doc total up by one from the
      O-17-confirmed 28/28/22/23 to **29/29/23/24**. This is a consequence of a *new* 2026-09-19
      ask made after O-17 was closed, not a reopening of O-17 — but the client should know their
      earlier-confirmed numbers just moved. `PR_LEVEL_CARDS` (`src/components/portal/data.ts`,
      Templates tab copy) updated to match.

### Notification — spacing polish, CONFIRMED, shipped 2026-09-19
- [x] Fixed spacing inside the notification border/card: rows had **no gap between them**
      (`flex flex-col` with no `gap`), so consecutive unread (grey) rows visually merged into one
      blobby shape with no visible border between them — confirmed by screenshot
      (`.shots/current-notifications-page.png` before/after). Added `gap-[8px]` between rows in
      both the bell popover and `/portal/notifications`.
- [x] Fixed text spacing inside each row: body line-height 20px→22px, message-to-timestamp gap
      6px→8px. Also extracted the row markup — previously duplicated verbatim in both
      `NotificationBell.tsx` and `NotificationsList.tsx` — into a shared
      `src/components/portal/kit/NotificationRow.tsx` per the kit rule.

### Accreditation Assignment — spacing polish, CONFIRMED, shipped 2026-09-19
- [x] Found via screenshot zoom (`.shots/current-assignment-zoom.png`): the `StatusPill` `sm` size
      (used by both `InternalAccreditorAssignment.tsx` and `QacPersonnelAssignment.tsx`'s Status
      column) had only `px-[6px]` at a 9px font, so a longer label like "In progress" pressed
      against the pill's edges. Widened to `h-[18px] px-[8px]`
      (`src/components/portal/kit/StatusPill.tsx`) — table column layout itself already matched the
      frame (`assets/FIGMA/internal_accreditor/02-Accreditation.png`) and needed no change.

### Program reassignment (drag and drop) — new feature, CONFIRMED, shipped 2026-09-19
Lives in **QAC Admin → Program Management** (`/portal/settings/programs`, new tab in
`SettingsTabs.tsx`).
- [x] Admin/QAC Personnel can drag-and-drop a program from one college's column to another
      (`ProgramManagement.tsx`, native HTML5 drag-and-drop — no new dependency added).
- [x] On drop, `reassignProgramCollege()` (`src/lib/admin.ts`) updates `programs.college_id` for
      real (optimistic move, rolled back on write failure).
- [x] Docs/records need no separate "carry over" step: `submission_documents` and `submissions` key
      on `program_id`, which a college reassignment never touches — this was already true of the
      schema, not new work.
- ⚠️ **Access-scope assumption**: `/portal/settings/*` is gated to `qac_admin` only
      (`settings/layout.tsx`), so Program Management inherits that even though the note says
      "Admin/QAC Personnel." The new RLS policy (`20260919000200_qac_reassigns_program_college.sql`,
      also unapplied — see below) grants the *write* to both roles already, so opening a QAC
      Personnel nav entry point later needs no further backend work — only a UI decision on where
      it should live for that role, which the note doesn't specify.

### User Management — QAC Admin, new feature (stub only for now), CONFIRMED, shipped 2026-09-19
Lives in **QAC Admin → User Management** (`/portal/settings/users`).
- [x] "Invite user" modal: email + role dropdown (`InviteUserModal.tsx`), opened via
      `?modal=invite` — the same URL-driven overlay convention every other modal in the kit uses.
- [x] Submit is a stub: no `invites` table, no email — it pushes a confirmation toast ("would be
      invited as …, sending isn't wired up yet") and closes. Flagged in the component's own
      comment, same convention as Extension Monitoring/Feedback's fixture-backed screens.

### Internal Accreditor → QAC service evaluation form — SCOPED, not built this pass
Client supplied a sample form ("Survey Visit - EVALUATION FORM"): a satisfaction survey filled by
the internal accreditor about QAC's assistance during a visit. **Distinct from both** existing
things: not the Program Rep "QAC Service Evaluation" shipped 2026-09-18
(`/portal/submission/evaluation` — program rep rates QAC), and not the still-open "Survey
Instrument" (accreditor evaluates the *program* on-site). This is a third form: accreditor rates
*QAC's* assistance after a visit.
**2026-09-19: scoped, deliberately not built.** The `/goal` run that shipped the six items above
was asked to "scope" this one rather than "implement" it, and the note's own open question is
exactly the thing a build would have to guess: what triggers the form and whether it's required.
Building the fields without that would mean either inventing a trigger (the thing "don't assume"
was written to prevent) or shipping a form nobody is ever routed to. Everything decidable without
the client is nailed down below so a future pass can build it in one sitting:
- [ ] Fields, all confirmed from the sample form, unchanged from the original read:
  - Visit-type selector: Preliminary Survey Visit / Level 1-4 (Level 3 & 4 each split Phase 1/2) /
    Application for COPC / Other (free text).
  - 5-point satisfaction scale (5 Extremely satisfied → 1 Not satisfied at all) across two rated
    groups: Assistance quality (Usefulness, Relevance, Responsiveness, Clarity, Impact) and Staff
    manner (Courtesy, Promptness, Friendliness, Sensitivity to Client's Needs, Helpfulness).
  - Free-text Comments and Suggestions field.
  - Evaluator fields: Name, Designation/Academic Rank, Branch/Campus, Date Accomplished.
- [ ] Proposed shape for the build, decided so it doesn't need re-deriving: a new
      `qac_assistance_evaluations` table (mirroring `submission_evaluations`' shape — see
      `/portal/submission/evaluation`'s backing table — one row per accreditor per visit); a new
      screen off the Internal Accreditor's Evaluation nav item, same `StarRating`/`SelectField` kit
      pieces `ProgramRepServiceEvaluation.tsx` already uses for the Program Rep's own QAC rating.
- [ ] Still open, raise with the client directly: what triggers this (after visit completion? per
      level?) and whether it's required or optional. Until answered, do **not** guess a gate — an
      ungated, always-reachable entry point is a real UX regression the client would need to
      approve, not a safe default.

## Pending assets from client — track these, don't lose them

- [x] **QAC Events UI** — delivered 2026-09-18 (re-export, see the section above) and implemented
      same day.
- [ ] **Program Rep Calendar UI** — still not delivered, its own frame (not covered by the QAC
      EVENTS re-export above). Drop in `design/client-screenshots/events/` when it arrives.
- [ ] **Internal Accreditor — Assignment/Evaluation/Events** — still not delivered
      (`assets/new frames/Internal Accreditor/` was empty 2026-09-18). Drop in
      `design/client-screenshots/internal-accreditor/`.
- [ ] **QAC Admin/Personnel** — still not delivered. Drop in
      `design/client-screenshots/qac-admin-personnel/`.

## 2026-09-06 meeting notes (decoded)

### Survey Instrument — new feature, does not exist in the codebase yet — CONFIRMED
- [ ] Triggers after all required documents are **reviewed and approved** (not just uploaded) —
      likely the same gate as `markReadyForSurveyVisit()` (`src/lib/assignment-actions.ts:376`).
- [ ] Filled out by the **accreditor (visiting team)** during the on-site visit.
- [ ] Must support **saveable drafts** (partial fill-in, come back later).
- [ ] Must be **unique per program** — not one shared instrument/template across all programs.
- [ ] Content area **scrollable within a fixed-height container**, not growing the page.

### Evaluation — still open
- [ ] "Form" — unresolved whether this means a new fillable on-screen rubric (separate from the
      existing signed PDF output at `src/lib/evaluation-form.ts` / `/api/evaluations/[id]/form`)
      or something about that existing output. **Raise directly with the client**, don't assume.

### Events — CONFIRMED, partly delivered
- [x] QAC's Events UI arrived (`assets/new frames/EVENTS/`, re-exported 2026-09-18) and is
      implemented — Calendar/Event Schedule tabs on `/portal/events`, see the 2026-09-18 section
      above.
- [ ] Program Rep and Internal Accreditor still need their own Events frame — not a polish pass on
      the existing calendar, a new design, per the original note. Drop in
      `design/client-screenshots/events/` when it arrives.

### Document counts per level — CONFIRMED, O-17 CLOSED
- [x] Client confirmed: **PSV = 28 docs, Level 2 = 28 docs (each separately, not combined),
      Level 3 = 22 docs, Level 4 = 23 docs.** Matches what's already implemented
      (`src/lib/reference/phases.ts`'s 18 shared docs + `BACKEND.md §2.1`'s per-level arithmetic).
      **No need to re-raise O-17 in the meeting** — already answered.

### About — CONFIRMED
- [ ] **SANJAY P. CLAUDIO, MNSA, CESE** (Director, first official listed —
      `src/app/(public)/about/page.tsx:38`) — his name/role text and photo container are too big
      on the public About page. Needs sizing fix relative to the other officials.

### Program Rep — CONFIRMED
- [ ] Documents tab, inside the level views (**PSV-Lvl2, Lvl3, Lvl4** —
      `src/components/portal/screens/ProgramRepDocuments.tsx`, `TemplatesTab`): content is
      currently bunched in the **upper-left**. Needs to be **centered**, and the **level labels
      made smaller** on all three level views, not just one.
- [ ] Selected/active tab font size in `DocTabs` needs to be **smaller** than it is now.
- [ ] Calendar UI — same "needs UI work" note as Events above; Program Rep's calendar view.
- [x] **RESOLVED — already does this, no change needed.** Phases document uploads go through
      `/api/submissions/upload/route.ts` (`phase_document_id` set on the row) same as any other
      submission document, and `storagePath()` there already keys the stored file on `docUuid`,
      never the user's original filename (`src/app/api/submissions/upload/route.ts:184-199`).

### 2 Accreditor(s) — CONFIRMED
- [ ] Team of **2 accreditors**; **PSV must reach 100% before Level 1 can start.** Not currently
      found as an explicit gate in `src/lib/assignment-transitions.ts` (`canAdvanceAssignment()`)
      — treat as a **new workflow gate to add**.

### Internal Accreditor
- [ ] **E-sign upload** — CONFIRMED. Today `SignaturePad.tsx` ships Draw and Type only; add a
      third method, **upload an image**, alongside Draw/Type.
- [ ] "Assignment / Evaluation / Events" — CONFIRMED there's an actual update, not just a
      checklist item: **client will send updated frames** for these 3 screens
      (`InternalAccreditorAssignment.tsx`, `InternalAccreditorEvaluation.tsx`,
      `src/app/portal/events/page.tsx`). ⏳ **Waiting on frames — see "Pending assets" below.**
- [ ] **Discipline Expertise dropdown** — CONFIRMED. Change `ProfileSpecialtyCard.tsx`'s
      `ExpertisePicker` chip picker to an actual dropdown-style control.

### QAC Admin / Personnel
- [ ] "Update UI" + "Standardize Personnel same as Admin" — **client will send frames** showing
      what should change; no specifics yet. ⏳ **Waiting on frames — see "Pending assets" below.**
- [ ] **Checked — net-new feature.** Admin should be able to edit a user's Full Name, Campus, and
      Position (Academic Program role or QAC role). `UserAccreditorEditor.tsx` only covers
      Discipline Expertise (one `<input>`, the specialty search box) — no fullname/campus/position
      fields exist anywhere on the admin side yet. This needs a new editor UI. It's allowed by the
      backend: `guard_profile_privileged_columns` already lets `qac_admin` write these columns
      (`.claude/session-state.md` Round 2 decisions) — only the UI is missing.

### QAC — CONFIRMED
- [ ] QAC sets a deadline **per assignment** — needs a **dedicated field on the assignment record**
      (not a free-floating calendar entry) storing the deadline QAC set, and that deadline must
      also **show up on the calendar** view. So: add the field to the assignment, and surface it
      via the existing events/calendar system (`src/lib/events.ts`, `MiniCalendar.tsx`) rather
      than requiring QAC to separately create a calendar event.

### Session Token — bug, not a feature ask
- [ ] Not a client feature request — **a bug noticed while testing**: gets logged out
      unexpectedly during user testing (switching between test accounts, or sitting idle).
      Investigate Supabase Auth session/token expiry and refresh behavior on the portal
      (`src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/current-user.ts`).
      Not something to raise with the client — an internal fix.

---

## Assets needed from client

- [ ] Employee photos: PALMA, ENTIENZA, DISTOR, TRANCE — none exist in `assets/EMPLOYEES/`.
      Currently lifted from the client's own screenshots and re-framed as a stopgap. Need real
      photo exports. (`design/prototype-notes.md:180`)
- [x] **DROPPED — not needed anymore.** Gov. Recognitions hero re-export at ≥1850px.

## Content corrections to confirm

- [x] **RESOLVED — no action needed.** Campuses stat-band color: checked
      `src/app/(public)/about/campuses/page.tsx` — both rules already use the `bg-maroon` token
      (the most-used color), not the prototype's off `#990000`. Already correct as shipped.
- [ ] **Flag to client (can't fix ourselves)** — ALFONSO and CABIAO campus copy both cite
      "Republic Act No. 11754" as their charter (`src/app/(public)/about/campuses/page.tsx:35,55`).
      This is client-supplied factual/legal copy (the actual RA number establishing each campus),
      not something we generated — likely one citation is a copy-paste error, but we can't verify
      the correct RA number ourselves. Ask the client for the correct number for each.
- [x] **FIXED.** Statute bold/color emphasis normalized to plain `**bold**` (matching the other 7
      RAs): `src/app/(public)/about/campuses/page.tsx` — MULANAY's RA 7645 now bolded, STO. TOMAS's
      RA 9472 changed from maroon `__bold__` to plain `**bold**`.
- [x] **DROPPED — keep as-is.** LOPEZ's doubled period in source data; shipped with a single
      period, not raising with client.

## Design deviations to sign off

- [x] **DROPPED — not on the active agenda.** Off-token sizes (level labels, campus titles, stat
      numerals, etc.) — user's call: anything not in the 2026-09-06 notes is considered accepted
      as shipped. Not being raised with the client.
- [x] **RESOLVED — no fix needed.** Navbar height: prototype ~58px vs our 80px. Decided: **keep
      80px.** (`design/prototype-notes.md:210`)
- [ ] **Reframed — navbar border/edge alignment.** The public (white) navbar and the portal
      (maroon) navbar don't align at their border/edge. **Client confirmed the maroon/portal
      version's positioning is correct** — fix the public white navbar to match it. (Original
      seal-visibility framing in `design/prototype-notes.md:208` may be a symptom of this same
      misalignment, not a separate issue — check both together.)
## Already resolved — dropped, not on active agenda

- [x] Campus stat band scale-up (2026-07-22) and brand lockup zoom-layer fix (2026-07-26) — both
      dropped per user's call; not part of the 2026-09-06 agenda.

## Backend / data questions for the client

- [x] **O-10 — CLOSED, code change needed.** Client's call: **no demotion at all** — a program
      that fails revalidation simply **stays at its current level**, it does not drop a level.
      This differs from the current implementation ("exactly one level down" — see the spot
      commented in `apply_award_on_release`, per `plans/BACKEND-RESUME.md:92`). Needs a follow-up
      code/migration change to remove the demotion step.
- [x] **O-17 — CLOSED.** `requirement_areas` row count confirmed by client's own 2026-09-06 note
      (PSV=28, Lvl2=28, Lvl3=22, Lvl4=23 docs) — matches the **42**-row per-level implementation.
      No need to re-raise. (`plans/BACKEND-RESUME.md:90`)
- [x] **O-18a — CLOSED.** Sta. Mesa COED count of **19** (corrected from 20) confirmed correct.
- [x] **O-18b — CLOSED, code/data change needed.** "Master of Arts in Physical Education and
      Sports" should be moved from **COED** to **CHK** (College of Human Kinetics). Update the
      program's college assignment in the seed/reference data.
- [x] **O-18c — CLOSED, no change.** Both Library and Information Science degrees stay filed
      under COED — user's call, fine as-is.
- [x] **O-20 — CLOSED, code change needed.** Hard-pin **Asia/Manila** everywhere for event
      datetime handling (matches the direction already noted in
      `plans/09a-ui-refactor-screens.md:464`) rather than capturing an explicit UTC offset from
      the form. Confirm `createEvent` and any other datetime read/write paths consistently assume
      Manila rather than the server's local clock.
