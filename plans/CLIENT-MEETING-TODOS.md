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

### Dashboard navigation — CONFIRMED
- [ ] Event Calendar (dashboard widget): clicking an event should navigate straight to that event's
      tab/page, not just highlight it. Ties into `getEvents()`/`getEventSchedule()`
      (`src/lib/events.ts`) — needs a per-event target route (which type → which screen).
- [ ] Recents (dashboard widget): clicking a recent item should open wherever that item actually
      lives (the correct tab/section for that specific item), not a generic view. Check
      `dashboards.ts` for what "recent item" types exist and what each should route to.

### Documents — Phase 2, CONFIRMED
- [ ] Add **MOA (Memorandum of Agreement)** as a new document/sub-category in Phase 2.
- [ ] Existing docs (Notice of Meeting, Minutes of Meeting, Project Proposal, Action Plan, Budget
      Proposal) stay exactly where they are — this is additive, not a reshuffle.

### Notification — spacing polish, CONFIRMED
- [ ] Fix spacing inside the notification border/card.
- [ ] Fix text spacing inside notifications so it reads cleaner.

### Accreditation Assignment — spacing polish, CONFIRMED
- [ ] Fix letter-spacing/text-spacing in the Accreditation Assignment section.

### Program reassignment (drag and drop) — new feature, CONFIRMED
Lives in **QAC Admin → Program Management**.
- [ ] Admin/QAC Personnel can drag-and-drop a program from one college/unit to another.
- [ ] On drop, the program is re-tagged to the new college — its college/unit field updates, it's
      not just visually moved.
- [ ] On transfer, the program's accreditation documents and records move with it — no manual
      re-upload. Example given: a Graduate School PhD program reassigned to its home college keeps
      its existing docs.

### User Management — QAC Admin, new feature (stub only for now), CONFIRMED
Lives in **QAC Admin → User Management**. Scope for this pass: **UI modal only** — no email actually
sent, no invite/account-creation backend wired up yet.
- [ ] "Invite user" modal: email input field + a role dropdown (the invited user's role).
- [ ] Submitting the modal does not need to send a real email or create a pending-invite record —
      just the modal UI or a fixture-backed submit.

### Internal Accreditor → QAC service evaluation form — new reference, needs scoping
Client supplied a sample form ("Survey Visit - EVALUATION FORM"): a satisfaction survey filled by
the internal accreditor about QAC's assistance during a visit. **Distinct from both** existing
things: not the Program Rep "QAC Service Evaluation" shipped 2026-09-18
(`/portal/submission/evaluation` — program rep rates QAC), and not the still-open "Survey
Instrument" (accreditor evaluates the *program* on-site). This is a third form: accreditor rates
*QAC's* assistance after a visit.
- [ ] Visit-type selector: Preliminary Survey Visit / Level 1-4 (Level 3 & 4 each split Phase 1/2) /
      Application for COPC / Other (free text).
- [ ] 5-point satisfaction scale (5 Extremely satisfied → 1 Not satisfied at all) across two rated
      groups: Assistance quality (Usefulness, Relevance, Responsiveness, Clarity, Impact) and Staff
      manner (Courtesy, Promptness, Friendliness, Sensitivity to Client's Needs, Helpfulness).
- [ ] Free-text Comments and Suggestions field.
- [ ] Evaluator fields: Name, Designation/Academic Rank, Branch/Campus, Date Accomplished.
- [ ] Open question for the client: what triggers this (after visit completion? per level?) and is
      it required or optional — not stated in the notes, don't assume.

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
