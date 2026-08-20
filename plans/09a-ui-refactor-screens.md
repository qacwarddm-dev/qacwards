# 09a — Screen-by-Screen Refactor Specs

Every route in the product, with a modernity verdict, the concrete problems, and the target design.
Companion to `plans/09-ui-refactor.md` (strategy, phases) and `plans/09b-design-system.md` (tokens,
component APIs). Colours, fonts and type sizes are frozen throughout — every change below is
spatial, structural, behavioural or stateful.

Wireframes are schematic, not measurements. Nothing here is a px value; the layout system in 09b §3
owns those.

## Verdict legend

| | Meaning |
|---|---|
| **REBUILD** | The layout itself is the problem. Rewrite the screen. |
| **RESTRUCTURE** | Composition is sound; hierarchy, states and responsiveness are not. |
| **UPGRADE** | Good bones. Add states, a11y, motion, responsive behaviour. |

## Verdict table

| Route / screen | Verdict | Headline problem |
|---|---|---|
| `/` | REBUILD | An image, five icon links, and a "video coming soon" box. No content, no CTA, one dead link. |
| `/about` | RESTRUCTURE | 365 lines of copy + layout + a hand-tuned 5-row portrait grid, all inline. |
| `/about/campuses` | RESTRUCTURE | 22 cards in a flex-wrap tuned so the 22nd centres; no search on 22 items. |
| `/about/degree-programs` | REBUILD | 52 lines for the page prospective students actually want. |
| `/accreditations` | UPGRADE | Fixed 168px stat cards, no drill-down from a level to its programmes. |
| `/gov-recognitions` | UPGRADE | Placeholder content in a fixed grid; no detail view. |
| `Navbar` | UPGRADE | Dropdown lacks menu semantics and roving focus. |
| `Footer` | RESTRUCTURE | Static; duplicates the auth footnote. |
| `/login` + `forgot` + `reset` | RESTRUCTURE | Brittle 922px seam + zoom; no validation UX, no success states. |
| `/register` (4 steps) | RESTRUCTURE | Four standalone cards; no stepper, no OTP UI, no strength meter. |
| Portal shell | REBUILD | Fixed 1440 canvas + `zoom`; no mobile; Log Out competes with nav. |
| `/portal/dashboard` (x3) | REBUILD | All three lead with statistics; none answers "what needs me now". |
| `/portal/documents` (x7 states) | REBUILD | Six components for one screen family; no sort, preview, bulk or drag-drop. |
| `/portal/submission` | REBUILD | 406-line screen, seven URL states, no timeline, no progress legibility. |
| `/portal/assignment` + `/new` | RESTRUCTURE | Create flow has no search/filter on accreditors; no workload signal. |
| `/portal/evaluation` + `/[id]` | REBUILD | Single-scroll sheet; the two primary actions are dead buttons. |
| `/portal/events` | RESTRUCTURE | Month grid only, no keyboard, no agenda, legend is not a filter. |
| `/portal/reports` | REBUILD | Stat row + a disabled button + an empty state. |
| `/portal/activity` | RESTRUCTURE | A 5-column table of an audit log; no filters, no grouping. |
| `/portal/profile` | RESTRUCTURE | 2x2 fixed grid, card-in-card-in-field nesting, unconfirmed destructive action. |
| `/portal/settings/*` | RESTRUCTURE | The most consequential controls in the product have the least ceremony. |

---

# A. Public site

## A.1 `/` — Home · REBUILD

**Now.** Hero image, five icon tiles, a heading in quotes, and a bordered box reading "Video coming
soon". No description of what QAC-WARDS is, no path to log in or register, no news, no numbers.

**Bug (BUG-7).** The "Personnels" tile links to `/personnel`. No such route exists — it 404s. Fix in
Phase 0 alongside BUG-6 (`/portal/performance`).

**Target.**

```
┌──────────────────────────────────────────────────────────────┐
│ HERO  full-bleed campus image, maroon scrim left→right       │
│   eyebrow  QUALITY ASSURANCE CENTER                          │
│   .t-display  Accreditation, tracked end to end.             │
│   .t-body     One place for programmes, documents,           │
│               evaluations and schedules.                      │
│   [ Log in ]  [ Register ]           ← primary + secondary   │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ AT A GLANCE   4 StatCards, auto-fit grid, drill-down links   │
│  84 accredited · 22 campuses · N programmes · N with COPC    │
└──────────────────────────────────────────────────────────────┘
┌───────────────────────────┬──────────────────────────────────┐
│ EXPLORE  5 destination    │ WHAT'S NEW                       │
│ cards (icon + label +     │ latest recognitions / events,    │
│ one-line description)     │ 3 rows, dated, → View all        │
└───────────────────────────┴──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ "PUP Ako, Tagumpay Ako!" + video (or an honest placeholder   │
│  that says what will be here and when)                       │
└──────────────────────────────────────────────────────────────┘
```

- Icon tiles become `Grid min="240px"` destination cards: icon, label, one line of purpose. A bare
  icon over a word tells a first-time visitor nothing.
- Stats read from the same `getReportsStats`-class queries the portal already has, cached.
- Motion: hero copy staggers in (3 blocks, 40ms), stat numerals count up once (skipped under
  reduced motion).
- Responsive: hero text over image at all widths; scrim strengthens below `md` for contrast.

## A.2 `/about` · RESTRUCTURE

**Now.** 365 lines — the longest file in the repo — mixing copy, layout, a justified director's
message with a floated portrait, and an officials band of 5 hand-tuned rows (1/2/4/3/3, with
`gap-x-[106px]` and `gap-x-[130px]`).

**Target.**

- Copy → `src/content/about.ts` (already the pattern on Campuses; `design/prototype-notes.md`
  records that string arrays also sidestep the JSX-eats-spaces trap).
- Sections: Hero → Mandate → Director's message → History → Officials & staff. Each a `<Section>`
  with a consistent eyebrow + heading + `Prose` (`--prose-max` 68ch, which the current full-width
  justified paragraphs violate badly).
- Sticky in-page nav (`lg+`) down the left with scroll-spy; a `SegmentedControl` jump menu below.
- Officials band → `PersonGrid` on `Grid min="200px"`, portraits as `Avatar size=64` in a card with
  name + role. The baked-in 5px PNG frames stay (they are in the asset, per prototype-notes) — the
  CSS adds only the existing shadow.
- Keep the justified director's message and the floated portrait: that is deliberate editorial
  character, and it is the one place justification earns its keep.
- Responsive: 1 column below `md`; portraits shrink, never wrap mid-row awkwardly (auto-fit solves
  the 1/2/4/3/3 tuning).

## A.3 `/about/campuses` · RESTRUCTURE

**Now.** 22 cards in a `flex-wrap` with `justify-center`, sized so the lone 22nd card centres. Stat
band deliberately scaled up past the prototype at the client's request; rules are `flex-1` because
the fixed-width version could not survive that scale-up.

**Target.**

- `Grid min="320px"` + `justify-items-center` on the last row — same centring, zero tuning, and the
  `md:` type steps documented in prototype-notes stop being load-bearing.
- Add a `SearchField` + region filter chips above the grid (22 items is past the point where
  scanning beats filtering), with a live result count.
- Card: photo → title → 2-line clamped description → "Read more" that opens a `Dialog` with the
  full entry, so the grid stays scannable. Hover lifts `--elev-1` → `--elev-2`.
- Stat band keeps its client-approved larger scale; the numerals get `tabular-nums` and the side
  rules stay `flex-1`.

## A.4 `/about/degree-programs` · REBUILD

**Now.** 52 lines. The single highest-traffic page for a prospective student, and it is a list.

**Target.** A real programme finder:

```
[ Search programmes…                    ]  [Campus ▾] [College ▾] [Level ▾]
 Showing 47 of 231 programmes                              [ Clear all ]
┌──────────────────────────────────────────────────────────────┐
│ Programme                     Campus      College   Level     │
│ BS Information Technology     Sta. Mesa   CCIS      ●Level III│
│ …                                                             │
└──────────────────────────────────────────────────────────────┘
```

- `DataTable` with `sortable` on every column, `stackAt="md"` so each row becomes a card on a phone,
  accreditation level as a `StatusPill`.
- Filters are URL state (`?campus=&college=&level=&q=`), shareable and back-button correct.
- Empty: "No programmes match those filters" + `Clear all`.
- ~231 rows: filter client-side over a cached list (same reasoning `RepMapper` already uses and
  documents), paginate at 50.

## A.5 `/accreditations` · UPGRADE

Keep the four-text-shadow gold keyline on the numerals — it is genuine brand character and costs
nothing. Changes: responsive `Grid min="200px"` instead of fixed 168px cards; each level card
becomes a link into `/about/degree-programs?level=…`; add a plain-language "what this level means"
line per card; the `--font-status` band keeps its family.

## A.6 `/gov-recognitions` · UPGRADE

Responsive `Grid min="280px"`; card → `Dialog` with the full citation; honest placeholder state
while the `RECOGNITIONS` array is unfilled ("Recognitions are being catalogued" + contact link),
never lorem. Hero stays at natural aspect; the low-resolution source asset is a client re-export
item already on the record, not a CSS problem.

## A.7 `Navbar` · UPGRADE

Preserve exactly: the client-approved "darken the font only" hover with no pill background, the
solid maroon active pill, the 254px dropdown card, `bg-gray/15` hover rows, the chevron that fades
in without layout shift.

Add: `role="menubar"`/`menuitem` semantics, `aria-expanded` + `aria-controls` on the trigger,
roving focus (`ArrowDown` opens and focuses first item, `ArrowUp/Down` move, `Escape` closes and
returns focus, `Tab` closes), hover-intent delay (~120ms) so a diagonal mouse path does not close
it, focus-visible ring in maroon, and a mobile drawer with a focus trap. Add a skip-to-content link
as the first focusable element on the page — there is none today.

## A.8 `Footer` · RESTRUCTURE

Three responsive columns (About / Quick links / Contact), the PUP services line lifted into one
shared `SiteFootnote` used by both the footer and `AuthShell` (it is duplicated today), social and
`pup.edu.ph` links with proper `rel`, and a "last updated" line. `--font-footer` unchanged.

---

# B. Authentication

Shared: keep the split-hero composition and the 100px arc — the most distinctive thing in the
product — but rebuild it fluidly (09b §3), retire `--auth-scale`, and extract `AuthFootnote`.

Every form gets: `autocomplete` attributes, blur+submit validation (never per keystroke), inline
field errors with `aria-invalid`/`aria-describedby`, an error summary above the card for screen
readers, `Button loading` on submit, and `Enter` submitting from any field.

## B.1 `/login` · RESTRUCTURE

- Fields: institutional email, password (with reveal toggle that announces its state), "Remember
  me", `Forgot password?`.
- Failure: one `Alert` above the fields — *"That email and password do not match an account."* —
  never a field-level lie about which half was wrong.
- Rate-limit feedback: when the backend limiter trips, say how long, not "try again later".
- `RolePicker` (currently a bare select): a `RadioCardGroup` — each role a card with a one-line
  description of what that account can do. Choosing wrong costs a whole re-registration.

## B.2 `/login/forgot` and `/login/reset` · RESTRUCTURE

Dedicated success views, not a repurposed error slot: forgot → "Check your PUP webmail" with the
address echoed, a resend timer, and an "I did not get it" path. Reset → strength meter + live
requirements checklist + `autocomplete="new-password"`, then a success view that links to login.

## B.3 `/register` (email → verify → password → profile) · RESTRUCTURE

- `Stepper` (horizontal `md+`, vertical below) at the top of all four steps. Today each step is a
  standalone card with no sense of position.
- **verify**: six segmented OTP boxes with paste-across support, auto-advance, auto-submit on
  complete, resend countdown, and an explicit "check your @pup.edu.ph webmail".
- **password**: strength meter + requirements that tick live, built from frozen tokens
  (gray → yellow → approved).
- **profile**: role-conditional fields (Program Representative needs programme, Internal Accreditor
  needs expertise areas — `Combobox multiple`), grouped in `<fieldset>` with `<legend>`.
- Draft persistence already exists (`registration-draft.ts`); surface it — "We saved your progress"
  — and add a back path that does not lose it.

---

# C. Portal shell

## C.1 Layout · REBUILD

Three modes (09b §3). Below `md` the rail becomes a `Drawer`; at `md` a 72px icon rail with
tooltips; at `lg+` the full rail, user-collapsible at `xl` with the choice persisted.

`<main>` gets `id="main"` + a skip link. The scroll container moves off the zoom-divided height and
onto a plain `min-h-dvh` grid — deleting the `h-screen` footgun documented in `globals.css`.

## C.2 Sidebar · REBUILD

- **BUG-6**: `/portal/performance` is in the QAC Personnel rail (inherited by QAC Admin) with no
  route behind it. Drop the item or build the page (U-2).
- Grouped once a role exceeds 5 items (QAC Admin has 8):
  `WORK` · `LIBRARY` · `SCHEDULE` · `ADMIN`, with `.t-eyebrow` group labels.
- Pending-work counts as `Badge` on Assignment / Evaluation / Submission.
- Active row keeps the 2px maroon bar; the clip-path notch goes (a Figma artifact that costs a
  `drop-shadow` filter per row and reads as a glitch at fractional zoom).
- Log Out leaves the rail for the identity menu; the rail foot becomes the collapse toggle.
- `nav aria-label="Portal"`, `aria-current="page"`, arrow-key roving focus.

## C.3 Top bar · RESTRUCTURE

- Mobile menu trigger below `md`.
- Global search (`⌘K` / `Ctrl+K`) opening a `CommandPalette`: jump to any screen, search programmes,
  documents and people through the existing `pg_trgm` indexes. The portal has four separate search
  boxes today and no way to search across them.
- `NotificationBell` → `Popover`: New / Earlier grouping, unread dot, mark-all-read, per-item action
  link, empty state, `role="log"` on the list, arrow-key navigation, and a "See all" link to a full
  page (the panel truncates silently today).
- Identity block → `Popover` menu: Profile · Activity · Settings (admin) · Log out.
- Keep 80px height and the shared `BrandLockup`; drop `.brand-lockup`'s zoom coupling once
  `--portal-scale` is gone — the two bars then match by being the same component, which is what the
  client asked for.

## C.4 `PortalPage` · NEW

Every portal page currently opens with a bespoke measured `div` (`px-[81px] pt-[19px]`,
`px-[57px] pt-[45px]`, `px-[44.5px]`…). One component owns the gutter, max width, `<h1>` (several
pages have none), breadcrumb, description, action slot, optional tab strip, and the page-load
stagger.

---

# D. Portal screens

## D.1 `/portal/dashboard` · REBUILD (all three roles)

**Now.** Every role opens with a maroon welcome banner, then a stat row, then cards. The banner is
180px of decoration that says nothing actionable; statistics lead where tasks should.

**Target — one `DashboardGrid`, role-specific widgets.**

```
┌──────────────────────────────────────────────────────────────┐
│ Good morning, Melvin.        AY 2026-2027 · open · closes 30 Nov│  ← compact,
│                                                    [ … menu ]  │    replaces banner
├──────────────────────────────────────────────────────────────┤
│ NEEDS YOU NOW                                                 │  ← new, first
│  ▸ 3 documents returned for revision      → Fix them          │
│  ▸ Assignment invitation expires in 2 days → Respond          │
│  ▸ PSV scheduled 24 Aug                    → View             │
├───────────────────────────────┬──────────────────────────────┤
│ 4 StatCards (drill-down)      │ Mini calendar + next 3 events│
├───────────────────────────────┴──────────────────────────────┤
│ role widgets (charts, tables) — each its own Suspense boundary│
└──────────────────────────────────────────────────────────────┘
```

- The welcome banner shrinks to one greeting line plus the **open cycle state** — the single most
  load-bearing fact in the product (`openCycleName` is already fetched and currently unused on the
  dashboard). When no cycle is open, that line says so, in gold, with what it means.
- **Needs you now** is derived from data every role already loads: returned documents, unanswered
  assignment invitations, upcoming PSV, expiring items (`/api/cron/expiring` already computes this
  class of thing).
- Stat cards become links into the filtered list they summarise. A number you cannot click is a
  dead end.
- Charts (`CopcChart`, `StatusBarChart`): axis labels move from `--text-micro` to `--text-small`
  (micro fails AA for essential text), direct series labels instead of a colour-only legend, and a
  `VisuallyHidden` `<table>` of the same data.
- Per-role widget sets stay as they are — Program Rep: document status + recent uploads + on-going
  accreditation + calendar; Internal Accreditor: assigned evaluations + evaluation progress +
  upcoming schedule + calendar; QAC/Admin: COPC chart + assignment throughput + queue health.
- Every widget: `Skeleton` while streaming, `EmptyState` when empty, error caught by the panel's own
  boundary so one failed query cannot blank the dashboard.
- Responsive: 3 columns `xl`, 2 at `lg`, 1 below `md`; "Needs you now" always first.

## D.2 `/portal/documents` (+ `main-campus/[college]/[folder]`, `campuses/[campus]/[folder]`) · REBUILD

**Now.** Six kit components (`DocumentBrowser`, `FolderGrid`, `DocFileGrid`, `CoverCard`,
`FolderCard`, `DocCard`) plus `ProgramRepDocuments` (267 lines) covering seven frame states across
two parallel trees. Fixed 4-up grid (`grid-cols-4 gap-x-[27px]`). No sort, no preview, no bulk
action, no drag-and-drop, one empty message for three different situations.

**Target — one `FileBrowser`.**

```
Documents ▸ Main Campus ▸ CCIS ▸ Accreditation Reports
[ Search in this folder      ]  [Sort: Name ▾] [▦ ▤]  [ Upload ]
┌──────────────────────────────────────────────────────────────┐
│ ▸ folders (Grid auto-fit) — name, item count, ⋯ menu          │
│ ▸ files   — icon, name, size, updated, status pill, ⋯ menu    │
└──────────────────────────────────────────────────────────────┘
  ↑ list view is a DataTable with the same columns, sortable
```

- Breadcrumb from `Breadcrumb` with `collapseAfter={3}`; one implementation for both trees.
- Sort by name / updated / size; view (grid|list) persisted per user.
- Multi-select with a bulk bar: download as zip, move (where permitted).
- **PDF preview `Dialog`** instead of a forced download — the product is about reading documents,
  and `/api/documents/download` already produces the signed URL a viewer needs.
- Drag-and-drop upload where the role permits, with per-file progress via `FileDropzone`.
- Three distinct empty states: empty folder / no search results / **locked** (NDA not signed) — the
  NDA gate currently renders the whole tab blank. Locked state explains the gate and puts
  `NdaUpload` inline.
- Tabs (Templates / Common Documents / AACCUP & COPC) move to generic `Tabs` with counts.
- Responsive: grid auto-fits from 1 to 5 columns; list view stacks to cards below `md`.

## D.3 `/portal/submission` · REBUILD

**Now.** `ProgramRepSubmissions` is 406 lines driving seven URL states (`program`, `view`, `phase`,
`modal`) across Programs → Levels → Phases → Requirements, plus two different Add-Document modals.
The reps' single most important screen, and the hardest to read.

**Target — split into `SubmissionPhases`, `RequirementList`, `SubmissionRow`, plus the existing
upload modal, under one persistent context header.**

```
Submission ▸ BS Information Technology ▸ Level III
┌──────────────────────────────────────────────────────────────┐
│ AY 2026-2027 open · closes 30 Nov      Readiness ████████░ 78%│
│ Stepper:  ① Phase 1 done  ② Phase 2 current  ③ ─  ④ ─         │
├──────────────────────────────────────────────────────────────┤
│ Phase 2 — Documentation            18 of 30 uploaded          │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ☑ Self-Survey Report        v2 · 24 Aug · ●Approved  ⋯ │   │
│ │ ☐ Faculty Manual            optional                 ⋯ │   │
│ │ ⚠ Syllabi Compilation       returned · see remarks   ⋯ │   │
│ └────────────────────────────────────────────────────────┘   │
│                                    [ Upload document ]        │
└──────────────────────────────────────────────────────────────┘
```

- Programs → Levels stay as a picker, but a rep with one programme skips straight to it.
- The readiness band (`Not Started / Partially / Moderately / Nearly / Ready`, O-2's split) becomes
  a labelled progress meter with the band as its caption — currently it is a bare percentage in a
  `SplitStat`.
- **Submission timeline** per document: submitted → under review → returned/approved, with reviewer
  remarks inline. Reps today cannot see why something came back.
- Upload: `FileDropzone` with per-file progress, and the `pdf-parse` rejection reasons surfaced
  individually (wrong type, too large, unreadable, missing UUID) instead of one generic error.
- Both Add-Document modals converge on one `Dialog` with a `mode` prop.
- **No open cycle** is a first-class state: a banner explaining that filing is closed and when it
  reopens, with everything read-only rather than an upload button that fails.
- Responsive: stepper goes vertical below `md`; the document list is a stacked card list.

## D.4 `/portal/assignment` and `/portal/assignment/new` · RESTRUCTURE

**Now.** QAC Personnel see a 6-column table with a status stepper expandable per row. Internal
Accreditors see their own table with accept/reject squares and a URL-driven confirm modal. Create
Assignment (255 lines) filters campus → college → programme client-side, then fetches eligible
accreditors per programme.

**Target.**

- List: `DataTable` with sortable columns, status pill + inline `Stepper` detail (keep — it works),
  filters for campus / level / status, and an **overdue** treatment for invitations past their
  response window.
- Accreditor's accept/decline: `ConfirmDialog`, with `requireReason` on decline. Today reject has no
  frame and no flow at all.
- Create Assignment becomes a two-pane task:

```
┌ 1. Choose the programme ─────────┬ 2. Choose accreditors ───────┐
│ [Campus ▾] [College ▾]           │ [ Search name or expertise ] │
│ [ Combobox: programme          ] │ [Expertise ▾] [Workload ▾]   │
│ [ Level ▾ ]                      │ ┌─────────────────────────┐  │
│                                  │ │ Name  Expertise  Load ⊕ │  │
│ Selected: BSIT · Level III       │ │ …                        │  │
└──────────────────────────────────┴─┴──────────────────────────┴──┘
                       [ Cancel ]  [ Create assignment (2 selected) ]
```

- A **workload column** (open assignments per accreditor) — the one fact that makes this decision
  well-informed and which nothing surfaces today.
- Multi-select assign in one action instead of a per-row `Assign` button.
- The missing due-date field: add it, defaulted from the cycle, since the assignment already carries
  a null one and the response window is what makes "overdue" meaningful (U-8 below).
- Unsaved-changes guard on navigation away.

## D.5 `/portal/evaluation` and `/portal/evaluation/[id]` · REBUILD

**Now.** The list is a `Panel` + `DataTable` with an expanded stepper. The detail (`234` lines,
transcribed by eye from a 1x export and flagged as provisional) is a single scroll of summary
table → document chips → decisions, with `Evaluate` and `Return` rendered but **not wired**.

**Target — a two-pane review workspace.**

```
┌ Assignment header: campus · college · programme · level · score ┐
├──────────────────────────┬───────────────────────────────────────┤
│ DOCUMENTS (left rail)    │ VIEWER (centre)      │ DECISION (right)│
│ ▸ Phase 1 (4/4)          │  embedded PDF        │ ○ Approve       │
│ ▸ Phase 2 (2/6)          │  page controls       │ ○ Return        │
│   • Self-Survey ●        │                      │ Remarks ▁▁▁▁    │
│   • Syllabi     ⚠        │                      │ Score  [   ]    │
│ ▸ Requirement areas      │                      │ [ Save decision]│
└──────────────────────────┴──────────────────────┴─────────────────┘
  sticky action bar:  ← Prev doc   ·   3 of 12 decided   ·   Next doc →
```

- Per-document decision with autosave and an explicit "saved" indicator; today the sheet is
  all-or-nothing.
- Keyboard: `J`/`K` or arrows move between documents, `A` approve, `R` return, `?` shows the
  shortcut sheet.
- `Evaluate` / `Return`: either wire them with a score+remarks form (which is what the missing UI
  actually is) or replace the dead buttons with an explanatory disabled state (U-7). A button that
  does nothing is worse than no button.
- Progress ("3 of 12 decided") is always visible; completing the last one offers Submit.
- Responsive: below `lg` the three panes become tabs (Documents · Viewer · Decision).

## D.6 `/portal/events` · RESTRUCTURE

**Now.** One card: 175px legend column + `MonthCalendar`. Month view only. No keyboard support, no
event detail, no create path in the UI, legend is decorative.

**Target.**

- `SegmentedControl`: Month · Week · Agenda. Agenda is the only usable view on a phone and the best
  view for "what is next" on any device.
- Day cell → `Popover` with that day's events; event → `Dialog` with full detail; QAC roles get
  create/edit in the same dialog.
- Legend becomes filter toggles (holiday / meeting / PSV / deadline), URL-bound.
- `MonthCalendar` gains `role="grid"` with full keyboard navigation (arrows, Home/End, PgUp/PgDn,
  Enter to open) — currently there is none.
- Month paging keeps the existing server action, and gets a loading state on the grid instead of a
  frozen month.
- Timezone is Asia/Manila everywhere, stated in the UI (O-20 is still open; the UI should show the
  zone regardless).

## D.7 `/portal/reports` · REBUILD

**Now.** Stat row, a card titled "Report Generation", a disabled `New` button, and an empty state.
Decision 18 says reports are KPI-derived and no generator exists.

**Target — an honest, useful screen even before a generator exists.**

```
KPI band (existing getReportsStats)  — 4 StatCards, drill-down
┌ Standard reports ────────────────────────────────────────────┐
│ ▸ Accreditation status by campus        [ View ] [ Export ]  │
│ ▸ Submission completeness by programme  [ View ] [ Export ]  │
│ ▸ Accreditor workload                   [ View ] [ Export ]  │
│ ▸ Document turnaround                   [ View ] [ Export ]  │
└──────────────────────────────────────────────────────────────┘
┌ Custom report builder ───────────────────────────────────────┐
│ Not available yet. Explains what it will do, and what the    │
│ standard reports above cover in the meantime.                │
└──────────────────────────────────────────────────────────────┘
```

Each "standard report" is a saved query over data the portal already has, rendered as a `DataTable`
with CSV export. That converts a dead screen into the reporting the office actually needs, without
building a generator (U-6).

## D.8 `/portal/activity` · RESTRUCTURE

**Now.** A 5-column table of the audit trail with keyset pagination (correct) and a truncated free-
form "Change" cell.

**Target.** Day-grouped timeline: date heading, then rows of `Avatar` + actor + action verb + target
link + relative time, with the diff expandable inline rather than truncated. Filters for actor
(admin only), entity type, action and date range, all URL state. Keep keyset pagination, surfaced
through `Pagination`. Admin gets CSV export. Empty state distinguishes "no activity yet" from "no
activity matches these filters".

## D.9 `/portal/profile` · RESTRUCTURE

**Now.** Fixed 2x2 of cards; inside each, a grey inner panel; inside that, fields — three nested
surfaces. `Remove Photo` is a gold button that fires immediately.

**Target.**

- Two-column at `lg`, one below `md`, with the panels in a `Grid` rather than a measured split.
- One surface per panel; read-only rows become a `DescriptionList` (label above value, `—` for
  empty), which removes the inner grey box entirely.
- Photo: drag-drop + crop before upload, progress, and `Remove photo` behind a `ConfirmDialog`.
- Password: strength meter, live requirements checklist, `autocomplete="new-password"`, success
  toast, and a "you will stay signed in" note.
- Add: a compact "Account" summary (role, programme(s) represented or expertise areas, member
  since), a link to `/portal/activity` filtered to the user, and — for reps — the programmes they
  represent, which they currently cannot see anywhere.

## D.10 `/portal/settings/*` · RESTRUCTURE

Shared: `SettingsTabs` → generic `Tabs` under one `PageHeader`; every destructive or consequential
action gets a `ConfirmDialog` naming its object and stating its effect; every mutation reports via
toast; every table gains search + sort.

**`users` (`UserAdmin`).** Row actions collapse into a `Popover` menu (activate / deactivate /
change role). Role labels come from the shared map (`program_representative` → "Academic Program",
O-4). Bulk role change and an invite flow. Self-targeting guards stay mirrored in the UI as disabled
+ tooltip ("You cannot change your own role"), with the server action remaining authoritative.

**`reps` (`RepMapper`).** `Combobox` on both sides (~230 programmes, currently a filtered list).
Show the current mapping as removable chips. **Detaching removes a representative's access to
submissions they filed themselves** (O-15) — the confirm dialog must say exactly that. Unsaved
changes guard.

**`cycles` (`CycleManager`).** The highest-consequence control in the product: only one cycle may be
open, and closing is O-14's freeze. Target: a cycle timeline (past / open / planned), and an
open/close flow with a `ConfirmDialog` that summarises the blast radius — how many programmes, how
many in-flight submissions, what stops working — before it proceeds. Dates use `DateField` and stay
zone-free (`date` columns, per the existing note).

**`EmailQueuePanel`.** Per-message status, retry, and a clear **"SMTP is not configured"** state,
since it is not (M-5). The manual drain button keeps its role as the live-proof control, with a
result toast reporting how many messages actually sent.

---

# E. Cross-screen work that has no single home

1. **Command palette** (`⌘K`): routes, programmes, documents, people. One component, every screen.
2. **Keyboard shortcut sheet** (`?`): per-screen shortcuts, discoverable.
3. **Notification centre page** (`/portal/notifications`): the bell popover truncates; this does not.
4. **Search results page** (`/portal/search`): cross-entity, backed by the existing `pg_trgm`
   indexes.
5. **`/portal/performance`**: either build it (accreditor throughput, turnaround, cycle progress) or
   remove the nav item — BUG-6, U-2.
6. **Kit gallery** (`/portal/dev/kit`, dev-only): every component in every state, the fastest way to
   review the system without clicking through 30 routes. Deleted at release.
7. **Print styles**: evaluation sheets, reports and submission summaries get a `@media print` pass —
   this is an office that prints.

---

# F. New owner decisions raised by these specs

Numbering continues from `plans/09-ui-refactor.md` §11 (U-1…U-7).

| # | Question | Default |
|---|---|---|
| U-8 | Add a due date to assignments? The field does not exist in the UI (the frame omits it) and the action is called with null — but "overdue" and response windows depend on it. | Add it, defaulted from the cycle end date. |
| U-9 | Is a PDF preview acceptable, or must documents always download (audit/watermark concerns)? | Preview, with the download action kept beside it. |
| U-10 | `/` — is there real "what's new" content to show, or should the home page stay static? | Pull the three most recent public events/recognitions. |
| U-11 | Reports: build the four standard reports in this refactor, or ship the screen with the KPI band only? | Build them — they are saved queries over existing data. |
| U-12 | Should the evaluation workspace embed the PDF, given documents are in private buckets with signed URLs? | Yes; signed URL into an `<embed>`, expiring per existing policy. |
| U-13 | `/personnel` (BUG-7): build the page or drop the home tile? | Drop the tile in Phase 0; it is not in any plan. |

---

# G. Per-screen exit checklist

Applied to every screen above before its PR is considered done:

- [ ] Renders at 375 / 768 / 1280 / 1920 with no horizontal scroll and nothing clipped
- [ ] Loading (skeleton matching the real layout), empty, error and permission-denied states exist
- [ ] All actions reachable and operable by keyboard, with a visible focus ring
- [ ] One `<h1>`; heading order unbroken; landmarks labelled
- [ ] axe: zero violations at AA
- [ ] No status conveyed by colour alone
- [ ] No arbitrary px; no raw hex; no `className` styling override at a kit call site
- [ ] Every mutation reports success and failure
- [ ] Destructive actions confirmed, naming their object
- [ ] Copy follows 09b §8; dates and numbers go through `src/lib/format.ts`
- [ ] Before/after screenshots captured for the client at 1280
