# 09 — UI/UX Refactor

Full-surface refactor of every public page, auth screen and portal screen. **Colour themes are
frozen**: the five Figma colours and the derived set in `design/figma-tokens.md` ship unchanged,
nothing is recoloured, no dark mode. Everything else — spatial rhythm, hierarchy, states, motion,
responsiveness, accessibility, component structure — is in scope.

Companion to `design/figma-tokens.md` (tokens) and `design/prototype-notes.md` (how the current
screens were matched). Supersedes nothing; it is the layer that comes *after* the pixel-match work.

**The plan is three documents:**

| Doc | Holds |
|---|---|
| `09-ui-refactor.md` (this) | Strategy, constraints, foundations, kit verdicts, phases, risks |
| `09a-ui-refactor-screens.md` | Every route, one by one: verdict, problems, target layout, states |
| `09b-design-system.md` | Exact token CSS, type ramp, layout system, motion spec, component APIs |

**Scope is total.** Every page and every section is refactored. Where a screen is not modern — and
the verdict table in 09a names those individually — it is rebuilt, not patched.

---

## 0. The decision this plan forces

The portal today is a **1:1 reproduction of a 1440x810 Figma frame**, verified by a pixel-diff loop
(`design/prototype-notes.md`), scaled to wider windows by a CSS `zoom` hack (`--portal-scale`).
Every measurement is a literal px read off an export.

A modern, intuitive UI cannot be that and also be responsive, accessible and state-complete. This
plan therefore **retires the pixel-diff verify loop as the acceptance test** and replaces it with:
token compliance + a11y + viewport matrix + visual-regression baselines *of our own output*.

The prototype stops being the spec and becomes the **brand reference**: its colours, its type,
its maroon/gold institutional character, its screen inventory. Its px coordinates do not survive.

> **Owner sign-off required before Phase 1 starts.** If the client still contractually requires
> frame-exact screens, stop here and run only Phase 0 (bugs) + Phase 6 (accessibility), both of
> which are prototype-neutral.

Everything below assumes sign-off.

---

## 1. Constraints that hold regardless

| Constraint | Effect on this plan |
|---|---|
| Colours frozen | No new hex, no recolouring, no dark mode. Depth comes from *alpha of existing tokens*, elevation and spacing — never a new colour. |
| `design/figma-tokens.md` is source of truth | New scales (spacing/radius/elevation/weight/leading) are appended to its **"Derived — pending client sign-off"** section with a derivation note, same as `--color-surface` was. |
| Component kit rule (`CLAUDE.md`) | Anything on ≥2 screens is a kit component. This refactor *increases* the kit; it never adds a page-level `className` override. |
| `/portal` stays a literal segment | Route groups are not reintroduced. |
| Git rule | No `git add/commit/push` is run by the agent. Commands are printed. |

### Non-goals

- No backend, RLS, or data-model change. Screens keep their current server/client split.
- No new features. Reports gets an information architecture, not a report generator.
- No dark mode. No theming API.
- No design-token renaming — existing token names stay so every current call site keeps compiling.

---

## 2. Design direction

**Institutional editorial.** PUP is a 120-year-old state university; the accreditation office is a
document authority. The interface should read like a well-set academic register: generous margins,
strong typographic hierarchy off a small type ramp, hairline rules instead of boxes-within-boxes,
maroon used as *ink and structure* rather than as decoration, gold reserved almost entirely for
"needs your attention".

Five principles, applied everywhere:

1. **One accent per view.** Maroon carries navigation and primary action. Gold appears at most once
   per screen (pending state, or the one call to action). Green/red only on data.
2. **Hierarchy from weight and space, not from size.** The type ramp has four sizes; depth comes
   from 400/600/700 weights, letter-spacing on all-caps labels, and vertical space.
3. **Hairlines over containers.** Today a panel sits inside a card inside a page card. Target: one
   elevation per surface, dividers instead of nested borders.
4. **Every state is designed.** Loading, empty, error, partial, permission-denied, offline-ish and
   success are first-class, not afterthoughts. Today none of them exist as components.
5. **Motion explains, never decorates.** 120–220ms, `ease-out` in / `ease-in` out, one staggered
   reveal per page load, and full `prefers-reduced-motion` compliance. Currently: 47 `transition`
   uses, 0 keyframe animations, 0 reduced-motion guards.

---

## 3. Foundations (Phase 1)

These land before any screen is touched. They are what makes the rest cheap.

### F1 — Spacing scale

**Problem.** 81 portal files carry arbitrary px: `[10px]` x57, `[16px]` x51, `[20px]` x48, `[18px]`
x36, `[14px]` x36, `[22px]` x26, `[17px]` x22, `[19px]` x20, `[13px]` x19… These are export
measurements, not decisions, and they make two adjacent panels disagree by 1–3px for no reason.

**Target.** A 4px-based scale, snapped from the measured values (each existing value maps to the
nearest step; the mapping table goes in the token file so the derivation is on the record).

```
--space-1: 4px    --space-5: 20px   --space-9:  48px
--space-2: 8px    --space-6: 24px   --space-10: 56px
--space-3: 12px   --space-7: 32px   --space-11: 64px
--space-4: 16px   --space-8: 40px   --space-12: 80px
```

Page gutters collapse from today's `px-[57px]` / `px-[81px]` / `px-[44.5px]` to two values:
`--page-gutter` (responsive, 24→64px) and `--panel-pad` (24px, 32px at `lg`).

### F2 — Radius + elevation

Today: `rounded-[5px]`, `rounded-lg`, `rounded-[10px]`, `rounded-[14px]`, `rounded-[16px]`,
`rounded-[20px]`, `rounded-full`, plus one shadow token used for everything.

```
--radius-sm: 6px    (pills, chips, status)
--radius-md: 10px   (inputs, buttons, small cards)
--radius-lg: 16px   (panels, modals)
--radius-full
--elev-0: none                       (flat, hairline-bordered)
--elev-1: 0 1px 2px rgba(0,0,0,.06)  (resting card)
--elev-2: 0 2px 8px rgba(0,0,0,.10)  (= today's --shadow-card; raised/hover)
--elev-3: 0 12px 32px rgba(0,0,0,.16)(dialog, popover)
```

Rule: **a surface has exactly one elevation, and a nested surface has none.** This alone removes the
"card inside a card inside a card" reading on Profile, Reports and Create Assignment.

### F3 — Type ramp

Sizes stay exactly as tokenised (36/31/20/15/12/10/9). What is added is the *ramp* — the
size+weight+leading+tracking combination each role uses, so headings stop being ad-hoc:

| Role | Size | Weight | Leading | Tracking |
|---|---|---|---|---|
| `display` | `--text-title` 36 | 700 | 1.15 | -0.01em |
| `banner` | `--text-banner` 31 | 700 | 1.2 | -0.01em |
| `h1` (page title) | `--text-heading` 20 | 700 | 1.25 | 0 |
| `h2` (panel title) | `--text-subheading` 15 | 700 | 1.3 | 0 |
| `label` (all-caps section) | `--text-regular` 12 | 700 | 1.2 | 0.08em |
| `body` | `--text-subheading` 15 | 400 | 1.55 | 0 |
| `body-sm` / table cell | `--text-regular` 12 | 400 | 1.45 | 0 |
| `meta` | `--text-small` 10 | 500 | 1.4 | 0.02em |

`design/prototype-notes.md` already records that Tailwind v4 gives these a 1.5 line-height and every
heading needs an explicit `leading-[1.2]`. The ramp makes that a utility class instead of a per-call
liability — one of the largest sources of vertical drift in the codebase disappears.

### F4 — Layout & responsiveness (largest single change)

**Problem.** Of 81 portal files, **one** uses a responsive breakpoint. The portal is a fixed 1440px
canvas magnified by `zoom: var(--portal-scale)`. Below 1440 it does not adapt — it just gets cut
off. There is no tablet or phone experience at all for four roles whose users (programme reps,
accreditors) work off laptops and tablets.

**Target.**

- **Retire `--portal-scale` as a layout mechanism.** Keep the `@property` block temporarily behind a
  flag while screens migrate; delete at the end of Phase 4 together with the `h-screen` warning and
  the `.brand-lockup` zoom coupling (`src/app/globals.css`). `--auth-scale` follows in Phase 3.
- Breakpoints: `sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`. Portal is designed **at 1280**,
  degrades to a single column at `md`, and grows by *widening the content column to a max of 1440
  with fluid gutters* — not by magnifying pixels.
- **Container queries** for kit components (`@container`) so a card behaves the same in a 1-col and
  a 2-col page without the page telling it to.
- Shell: sidebar is `w-[250px]` fixed ≥`lg`, a 72px icon rail at `md`, and an off-canvas drawer
  below `md` triggered from the top bar.
- Every fixed-px width in a page (`w-[753px]`, `w-[493px]`, `w-[430px]`, `w-[365px]`…) becomes
  `max-w-*` + `flex-1`/grid track.

### F5 — Focus & interaction states

**Problem.** `focus:` appears **0 times** in the codebase. `focus-visible` **0 times**.
`outline-none` appears 3 times *with no replacement ring*. The entire product is unusable by
keyboard-only users and fails WCAG 2.4.7.

**Target.** A single focus treatment applied at the kit level:

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-maroon);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Plus a required four-state matrix for every interactive kit component: **rest / hover / active /
focus-visible / disabled**, and `aria-busy` for pending. Today `Button` has rest, a hover on the
`href` branch only, and a disabled look — the `<button>` branch has **no hover at all**.

### F6 — Motion

- Duration tokens: `--motion-fast 120ms`, `--motion-base 180ms`, `--motion-slow 260ms`.
- Easing: `--ease-out cubic-bezier(.2,.8,.2,1)`, `--ease-in cubic-bezier(.4,0,1,1)`.
- Page-load: one staggered reveal of the primary content blocks (40ms stagger, translateY 6px,
  opacity) — dashboards, document grids, table bodies.
- Route transitions: skeleton → content crossfade via `loading.tsx` + Suspense (§F7).
- Global `@media (prefers-reduced-motion: reduce)` kill-switch in `globals.css`, currently absent.

### F7 — Async states

**Problem.** Across ~30 routes there are **zero** `loading.tsx`, `error.tsx`, `not-found.tsx` files
and **zero** `Suspense` boundaries. `/portal/dashboard` awaits three queries in series-of-parallel
before rendering anything; the user sees the previous page frozen.

**Target.**
- `src/app/portal/loading.tsx` + per-route overrides where the shape differs (dashboard, documents,
  tables) rendering **skeletons that match the real layout**, from a new `Skeleton` kit primitive.
- `error.tsx` at `(public)`, `login`, `register`, `portal`, and `portal/settings` — each with a
  recovery action, never a raw stack.
- `not-found.tsx` at root and `portal` — the portal one keeps the shell so the user is not ejected.
- Suspense boundaries around every independently-fetched panel so the dashboard streams.

### F8 — Feedback

**Problem.** 74 ad-hoc `setError` / `error &&` sites, each rendering its own inline string; no
success feedback anywhere; no toast system.

**Target.** `Toast` (kit) + a `useToast()` provider mounted in `src/app/portal/layout.tsx` and the
auth layouts. Contract: **mutations report through toast; validation reports inline on the field.**
Server actions return a discriminated `{ ok } | { ok: false; field?; message }` so the two paths
are chosen by data, not by the call site.

---

## 4. Component kit refactor (Phase 2)

`src/components/portal/kit/` — 32 files today. Verdict per component:

### Rewrite

| Component | Why | Target |
|---|---|---|
| `DataTable` | Built from `div`s — screen readers get no table semantics at all. No sort, no built-in empty/loading, no row selection, no responsive behaviour; column widths declared twice (header + body). | Real `<table>` with `<caption>`/`<th scope>`, sortable headers, sticky header, built-in `empty`/`loading` slots, `stackAt` prop that renders each row as a definition card below `md`, one column definition driving both header and cell. |
| `Modal` | No `role="dialog"`, no `aria-modal`, no focus trap, no Escape handler, no scroll lock, no return-focus. Only closable by URL. | `Dialog` on the native `<dialog>` element (or Radix if the owner accepts the dep): focus trap, Escape, scroll lock, `aria-labelledby`, keeps the URL-driven close as one variant and gains a callback variant + `ConfirmDialog` preset for destructive actions. |
| `EmptyState` | Hardcodes `pt-[133px]`, one illustration, no action. | Variants `empty` / `no-results` / `error` / `locked`, optional icon or illustration, optional primary action, size `sm|md`, no imposed top padding (the parent owns placement). |
| `Field.tsx` | 9.5KB of five exports with inputs that set `outline-none` and no focus ring, no error state, no hint, no required marker, no `aria-describedby`. | Split into `TextField` / `SelectField` / `PasswordField` / `TextareaField` / `ReadOnlyField`, each with `label / hint / error / required / disabled`, wired `aria-invalid` + `aria-describedby`, and the F5 focus ring. |
| `Button` | No hover on the `<button>` branch, no loading state, no destructive variant, no `sm` size, no icon-right, variants named after where they appeared in a frame (`muted`, `yellow`). | Variants `primary / secondary / ghost / danger / link`; sizes `sm / md / lg`; `loading` (spinner + `aria-busy` + disabled); `iconStart` / `iconEnd`; full state matrix. Old variant names kept as deprecated aliases for one phase so nothing breaks mid-migration. |

### Extend

| Component | Add |
|---|---|
| `StatusPill` | Today 3 statuses (`pending/approved/disapproved`). The workflow has more: submission (draft, submitted, under review, returned, approved), assignment (assigned, accepted, declined, in progress, completed), cycle (open, closed), NDA (signed, unsigned), account (active, pending, disabled). One status registry, `tone` derived per status, sizes `sm/md`, optional dot-only form for dense tables. |
| `SearchField` | Debounce, clear button, `Ctrl/⌘+K` focus, loading spinner, result-count live region, URL-param binding helper. |
| `Card` | `header` / `footer` slots, `padding` prop, `as` prop, one-elevation rule enforced by an `inset` variant for nested surfaces. |
| `Breadcrumb` | Collapse to `…` past 3 levels, current page as `aria-current`, mobile "up one level" affordance. |
| `Stepper` | Vertical variant for narrow columns, per-step status (done/current/blocked/skipped), clickable completed steps. |
| `UploadList` / `DocFileGrid` | Per-file progress, retry, remove, error row, file-type icon, size + timestamp. |
| `MonthCalendar` / `MiniCalendar` | Keyboard grid navigation (arrow keys, Home/End, PgUp/PgDn), `role="grid"`, today marker, event density dots, month transition animation. |
| `StatCard` / `SplitStat` | Trend direction as icon+text (not colour alone — colour-blind users), optional sparkline, loading skeleton, clickable variant that drills into the filtered list. |

### New

`Skeleton`, `Toast` + `ToastProvider`, `PageHeader` (title + breadcrumb + description + actions —
currently every page hand-rolls this), `Tabs` (generic; `DocTabs` becomes a preset), `Badge`,
`Avatar` (with initials fallback — the top bar and Profile both hand-roll one), `Tooltip`,
`Popover`, `Alert` (inline banner for page-level messages), `Pagination` (generic; lift out of
`DataTable`), `FileDropzone`, `DateField`, `Combobox` (the accreditor/programme pickers deserve
type-ahead, not a bare `<select>`), `DescriptionList` (the Profile read-only rows), `SegmentedControl`
(generalises `ViewToggle`), `VisuallyHidden`, `Spinner`.

### Fold in / delete

`PanelHeader` + `CardTitleBar` + `SectionHeading` are three near-identical headers → one
`PanelHeader` with `size` and `icon` props. `RowList` (508B) folds into `DataTable`'s stacked
variant. `DocumentBrowser`, `FolderGrid`, `DocFileGrid`, `CoverCard`, `FolderCard`, `DocCard` are
six components for one screen family → consolidate to `FileBrowser` (view toggle + grid/list +
breadcrumb + search + empty/loading) with `FolderCard`/`FileCard` as its two tile types.

Net: 32 files → ~34, but covering roughly three times the surface, with the six document components
collapsing into one browser.

---

## 5. Shell refactor (Phase 3)

### 5.1 Top bar — `src/components/portal/PortalTopBar.tsx`

- Add a mobile menu trigger (`< md`) that opens the sidebar drawer.
- Add global search entry (⌘K) — the portal's four list screens each have their own box today and
  no way to search across them.
- `NotificationBell`: proper `Popover` (focus trap, Escape, arrow-key list), `role="log"` for new
  items, unread grouping (New / Earlier), "mark all read", empty state, and a link to a full
  notifications page rather than a panel that truncates.
- Identity block becomes a `Popover` menu: Profile, Activity, Settings (admin), Log Out. Log Out
  currently lives at the bottom of the sidebar where it competes with navigation.
- Keep the 80px height and the shared `BrandLockup`; **remove** the `.brand-lockup` zoom coupling
  once `--portal-scale` is gone (`globals.css`) — both bars then agree by simply being the same
  component at the same size, which is what the client asked for in the first place.

### 5.2 Sidebar — `src/components/portal/PortalSidebar.tsx`

- **Bug: `/portal/performance` is in `PORTAL_NAV.qac_personnel` (and therefore in `qac_admin`) but
  no route exists** — `src/app/portal/` has no `performance/` directory. Two QAC roles have a nav
  item that 404s. Fix in Phase 0: either build the page or remove the item (owner call, see §11).
- Three responsive modes: full rail (`lg+`), 72px icon rail with tooltips (`md`), off-canvas drawer
  (`< md`) with focus trap and Escape.
- Grouped navigation with all-caps section labels once a role has >5 items (`qac_admin` has 8):
  **WORK** (Dashboard, Assignment, Evaluation, Submission) / **LIBRARY** (Documents, Reports) /
  **SCHEDULE** (Events) / **ADMIN** (Activity, Settings).
- Move Log Out out of the rail into the identity menu; the rail's bottom becomes the collapse
  toggle.
- Active state: keep the 2px maroon bar; drop the clip-path notch (it is a Figma artifact that costs
  a `drop-shadow` filter per row and reads as a rendering glitch at non-integer zoom).
- Badge counts on Assignment / Evaluation / Submission so a user sees pending work without opening
  each screen.

### 5.3 Page frame

Every portal page currently starts with a bespoke `div` of measured padding
(`px-[81px] pt-[19px]`, `px-[57px] pt-[45px]`, `px-[44.5px]`…). Replace with one layout component:

```tsx
<PortalPage
  title="Assignments"
  description="Accreditors assigned to programmes this cycle."
  breadcrumb={[...]}
  actions={<Button …>New</Button>}
>
  …
</PortalPage>
```

It owns the gutter, the max width, the vertical rhythm, the `<h1>` (several portal pages currently
have **no `h1` at all**), and the page-load stagger.

---

## 6. Section-by-section

### 6.1 Public site — `src/app/(public)/`

| Route | Current | Target |
|---|---|---|
| `/` (100 ln) | Hero + status band, fixed crops | Clear hero with one primary CTA (Login / Register), an "Accreditation at a glance" stat band reusing `StatCard`, a "What's new" strip (events/recognitions), then footer. Responsive from 360 up. |
| `/about` (365 ln) | Longest file in the repo; copy, layout and the officials grid all inline. Justified director's message; portraits at `h-[310px]`. | Extract copy to `src/content/about.ts`; sections become `<Section>` + `<Prose>` components; officials grid becomes a responsive `PersonGrid` (5 hand-tuned rows → auto-fit tracks); add a sticky in-page nav for the six sections. |
| `/about/campuses` (248 ln) | 22 cards in a `flex-wrap` tuned so the 22nd centres; stat band deliberately off-prototype at client request | `grid` with `auto-fit minmax(320px,1fr)` and `justify-items-center` on the last row — same visual result, no manual tuning. Add search/filter by region, and a card hover that lifts (elev-1→2). |
| `/about/degree-programs` (52 ln) | Thin list | Filterable, searchable programme table (`DataTable` stacked below `md`) grouped by college, with accreditation level as a `StatusPill`. This is the page prospective students actually want. |
| `/accreditations` (100 ln) | Stat cards 168x168 with a gold keyline built from four text-shadows | Keep the keyline (brand character, cheap); make the grid responsive, add per-level explanation on hover/expand, link each level to the programme list filtered to it. |
| `/gov-recognitions` (73 ln) | Placeholder content, `gap-y-[86px]` grid | Same grid responsive; add empty/placeholder state that is honest rather than lorem; card → detail dialog. |
| `Navbar` | Dropdown closes on outside-click/Escape but has no `aria-controls`, no roving focus, no `aria-expanded` on the mobile trigger in all states | Full menubar semantics, roving `ArrowDown/Up/Escape/Tab` focus, `aria-expanded`+`aria-controls`, mobile drawer with focus trap. Keep the client-approved "darken the font only" hover and the solid active pill. |
| `Footer` | Static | Three-column responsive, quick links, contact, the PUP services line currently duplicated in `AuthShell`. |

### 6.2 Auth — `src/app/login/`, `src/app/register/`

Current: `AuthShell` is a beautiful, brittle 922px-seam composition with a radial-mask carve and an
undamped `--auth-scale` zoom; the footnote block is hardcoded inside it.

- Keep the split-hero composition and the 100px arc — it is the most distinctive thing in the
  product. **Rebuild it fluidly**: photo panel `flex-basis: clamp(0px, 64%-…, …)` with the arc as a
  border-radius on the panel rather than a masked square, so no zoom layer is needed. Photo drops
  out below `lg` exactly as now.
- Retire `--auth-scale` with `--portal-scale`.
- Extract `AuthFootnote` into its own file; it is shared chrome, not shell internals.
- **Forms**: inline validation on blur + submit (never on every keystroke), `aria-invalid`,
  `aria-describedby`, a single error summary above the card for screen-reader users, `autocomplete`
  attributes (`username`, `current-password`, `new-password`, `one-time-code` on verify),
  `Button loading` on submit, and a password-strength meter on `register/password` built from the
  existing gold/green/maroon tokens.
- `RolePicker`: currently a bare select. Make it a card-radio group with role descriptions — this is
  the one screen where a wrong choice costs the user a whole re-registration.
- `register/verify`: OTP input as six segmented boxes with paste support, resend timer, and a clear
  "check your @pup.edu.ph webmail" instruction with the address echoed back.
- `register` stepper: `Stepper` at the top of all four steps so the user knows how far they are —
  currently each step is a standalone card.
- `login/forgot` + `login/reset`: success states currently rely on the error slot; give both a
  dedicated confirmation view.

### 6.3 Portal — shared screens

**`/portal/dashboard`** (3 role screens, 45/114/143 ln)
- One `DashboardGrid` layout across roles; role screens supply widgets, not layout.
- Every widget gets a skeleton and an empty state; stat cards become drill-down links.
- Charts (`CopcChart`, `StatusBarChart`): add accessible fallback (`<table>` in `VisuallyHidden`),
  axis labels at `--text-micro` are below the AA floor for essential text → move to `--text-small`
  and keep micro only for non-essential gridline numerals.
- Add "what needs me now" as the first block for every role — today all three dashboards lead with
  statistics, which is the least actionable content on the screen.

**`/portal/documents`** + `main-campus/[college]/[folder]` + `campuses/[campus]/[folder]`
- Six components → one `FileBrowser` (§4). One breadcrumb implementation for both trees.
- Add: sort (name/date/size), grid/list persistence, multi-select + bulk download, file preview
  dialog for PDFs instead of a forced download, drag-and-drop upload where the role permits, and a
  real "locked" state for the NDA gate (currently the whole tab renders empty).
- `EmptyState` per level: empty campus vs empty folder vs no search results are three different
  messages today rendered as one.

**`/portal/submission`** (`ProgramRepSubmissions`, 406 ln — largest screen file)
- Split into `SubmissionPhases`, `RequirementList`, `SubmissionRow`, `SubmissionUploadModal`.
- The phase/level flow becomes a `Stepper` with per-requirement progress, so a rep can see "12 of 30
  requirements, phase 2 of 4" without counting rows.
- Upload modal → `FileDropzone` + per-file progress + validation messages inline (type, size, and
  the pdf-parse rejection reasons, which today surface as one generic error).
- Add a submission timeline (submitted → under review → returned/approved) with reviewer comments.

**`/portal/assignment`** + `/new`
- `QacPersonnelCreateAssignment` (255 ln): the eligible-accreditor table gets search, expertise
  filters, workload column, and a `Combobox` for programme selection.
- Assignment rows: status pill + stepper detail is good; add accept/decline deadline and an overdue
  treatment.
- `AssignmentResponse`: confirm dialog → `ConfirmDialog` with a required reason field on decline.

**`/portal/evaluation`** + `/[id]`
- `InternalAccreditorEvaluationDetail` (234 ln): two-pane layout — document viewer left, criteria
  form right — instead of the current single scroll. Sticky action bar (Save draft / Return /
  Approve) so the accreditor never scrolls to submit.
- Per-criterion save with autosave indicator; today the sheet is all-or-nothing.
- `Evaluate`/`Return` are currently disabled placeholders — either wire or hide behind an explicit
  "coming soon" affordance rather than a dead button (owner call, §11).

**`/portal/events`**
- `MonthCalendar` keyboard grid + agenda view toggle (month / week / agenda) — agenda is the only
  usable view on a phone.
- Event detail as a `Popover` from the day cell, full dialog for create/edit.
- Legend becomes a filter (click "Holiday" to hide holidays).

**`/portal/reports`** (35 ln, `EmptyState` + a disabled New button)
- The honest current state is "no generator exists" (decision 18). Give it an IA anyway: KPI band on
  top (already computed by `getReportsStats`), then a **saved views** list, then a disabled-with-
  explanation generator card that states what it will do and when — a disabled button with no
  explanation reads as a bug.

**`/portal/activity`** (86 ln)
- Timeline layout grouped by day, actor avatars, action-type icons, filters (actor / entity / date),
  keyset pagination already exists — surface it as `Pagination`.

**`/portal/profile`** (152 ln)
- The 2x2 panel grid becomes responsive (stacks at `md`). `DescriptionList` for the read-only rows.
- `ProfilePhotoCard`: crop-on-upload, drag-drop, progress, and a real destructive confirm for Remove
  Photo (currently a gold button that fires immediately).
- `ProfilePasswordCard`: strength meter, requirements checklist that ticks live, `autocomplete`.

**`/portal/settings`** (`users` / `reps` / `cycles`)
- `SettingsTabs` → generic `Tabs`, with the section title in `PageHeader`.
- `UserAdmin` (168 ln): row actions in a `Popover` menu, bulk role change, invite flow, and a
  destructive-action confirm that names the user.
- `RepMapper` (190 ln): `Combobox` on both sides, unsaved-changes guard.
- `CycleManager` (200 ln): the open/close action is the highest-consequence control in the product —
  `ConfirmDialog` stating exactly what closing does, plus a summary of affected programmes.
- `EmailQueuePanel`: status per message, retry, and a clear "SMTP not configured" state (it is not
  configured — see `plans/BACKEND-PROGRESS.md`).

---

## 7. Cross-cutting systems

| System | Today | Target |
|---|---|---|
| Loading | none | `Skeleton` + `loading.tsx` per route + Suspense per panel |
| Error | 74 inline `setError` sites | `error.tsx` boundaries + `Alert` (page) + field errors (form) + `Toast` (mutation) |
| Empty | one component, one message | 4 variants with actions |
| Success | none | `Toast` + optimistic UI where the mutation is safe |
| Forms | no validation UX, no `autocomplete`, no `aria-invalid` | Zod schema shared client/server, `useActionState`, field-level errors, error summary, dirty-state guard |
| Tables | div-based, no semantics | real tables, sortable, sticky header, stacked below `md` |
| Search/filter | 1 box, no debounce, no URL binding | URL-bound query state (`?q=&sort=&page=`), debounced, result counts, clear-all |
| Uploads | list, no progress | dropzone, progress, retry, per-file errors |
| Dialogs | no a11y | focus trap + Escape + return focus + scroll lock |
| Notifications | panel that truncates | grouped popover + full page + mark-all-read |
| Icons | Lucide at 5 different sizes/strokes | 16/20/24 at stroke 1.75, one set of size props |

---

## 8. Accessibility programme (WCAG 2.2 AA)

Current measured state: `aria-hidden` x54, `aria-label` x36, `aria-expanded` x5, `aria-current` x2,
`focus-visible` **x0**, landmark/heading structure incomplete, tables non-semantic, dialogs untrapped.

Work items, all folded into the phases above:

1. Focus visible everywhere (F5) — blocking.
2. Keyboard paths: full tab order, Escape closes every overlay, arrow keys in menus/calendars/tabs,
   skip-to-content link in both shells.
3. Semantics: one `<h1>` per page, ordered headings, `<nav aria-label>` on both navs, `<main>` in
   the portal shell (currently a bare `<main>` with no label), real `<table>`, `<fieldset>/<legend>`
   on grouped inputs.
4. Live regions: toasts `role="status"`, form errors `role="alert"`, search counts `aria-live=polite`.
5. Colour independence: status is never colour-only — every pill keeps its text, every trend gets an
   icon, chart series get patterns or direct labels.
6. Contrast audit against the frozen palette. Known risks to verify and fix **by weight/size, not by
   recolouring**: `--color-gray #7B7979` on `--color-surface #F5F5F5` (~3.9:1 — fails AA for body
   text at 12px), `--color-yellow #EFBF04` with white text on pills (~1.9:1 — fails badly; use black
   text on gold, which the palette already permits), `--color-link #3996FF` on white (~3.1:1 — needs
   underline + a darker usage context or restriction to large text).
7. Targets ≥24x24 (WCAG 2.2 §2.5.8). Today's 20px status pills and 14px icon buttons fail.
8. Motion: reduced-motion honoured globally.
9. Zoom: 200% browser zoom and 320px width must not clip — impossible today with `zoom`-scaled fixed
   layout, becomes possible after F4.

Tooling: `eslint-plugin-jsx-a11y` (recommended, strict on rules above), `axe-core` in a Playwright
pass over every route, and a manual keyboard script per role.

---

## 9. Performance

- Client components: 29 files carry `"use client"`. Audit each; several (calendars, tabs, view
  toggles) can be server-rendered with a small client island.
- Streaming: Suspense per panel means the shell paints immediately.
- Images: several `<Image>` with baked-in frame sizes; verify true pixel dimensions per
  `design/prototype-notes.md` gotcha, add `sizes`, and lazy-load below the fold.
- Fonts: five families (`Inter`, `Playfair Display SC`, `Poppins`, `Inria Serif`, `Roboto Serif`).
  Keep all five — they are tokens — but subset, `display: swap`, and preload only the two used above
  the fold per route.
- Remove the `zoom` layers: they force full-page relayout on resize and break `dvh` maths (already
  documented as a footgun in `globals.css`).
- Budget: LCP < 2.0s, CLS < 0.05, TBT < 200ms on a mid-tier laptop over 4G.

---

## 10. Execution plan

Phases are sequential; each ends green (`tsc`, `eslint`, build, axe pass on touched routes).

| Phase | Scope | Output | Rough size |
|---|---|---|---|
| **0. Bugs** | Two dead links (BUG-6 `/portal/performance`, BUG-7 `/personnel` on the home page); focus rings (F5); `prefers-reduced-motion`; dialog a11y on `Modal`; gold-on-white contrast fix | Ships regardless of the §0 decision | 1 PR |
| **1. Foundations** | F1–F8 tokens in `globals.css` + `design/figma-tokens.md`; `Skeleton`, `Toast`, `PageHeader`, `Alert`, `Spinner`, `VisuallyHidden`; `loading.tsx`/`error.tsx`/`not-found.tsx` | No visual change to existing screens except focus + async states | 2–3 PRs |
| **2. Kit** | Rewrites (`DataTable`, `Dialog`, `Field`, `Button`, `EmptyState`), extends, consolidation of the six document components into `FileBrowser` | Old APIs aliased so screens compile | 4–5 PRs |
| **3. Shell** | Top bar, sidebar (3 modes), nav grouping, `PortalPage`, auth shell fluid rebuild, `--auth-scale` retired | First visible change | 2–3 PRs |
| **4. Portal screens** | Dashboards → Documents → Submission → Assignment → Evaluation → Events → Reports → Activity → Profile → Settings, one PR each; `--portal-scale` deleted at the end | The bulk | ~10 PRs |
| **5. Public + auth screens** | Home, About, Campuses, Degree Programs, Accreditations, Recognitions, Navbar, Footer, login/register flows | | 4–5 PRs |
| **4b. New surfaces** | Command palette (⌘K), notification centre page, cross-entity search page, the four standard reports, `/portal/performance` (or its removal), print styles, dev kit gallery | The pieces no existing screen owns — see 09a §E | 3–4 PRs |
| **6. A11y + perf sweep** | axe over every route, keyboard scripts per role, contrast fixes, bundle/image/font pass, visual-regression baselines | Exit gate | 2 PRs |

**Ordering rationale**: foundations before kit before shell before screens, so nothing is refactored
twice. Public pages come *after* the portal because the portal is where the users are and where the
current design debt is concentrated (1/81 files responsive, 0 focus states).

### Exit criteria (all phases)

- No `focus-visible`-less interactive element; axe clean at AA on every route.
- Every route renders at 360 / 768 / 1024 / 1440 / 1920 with no horizontal scroll and no clipping.
- No arbitrary px in `src/components/portal/**` outside the token scales (lint rule).
- Every async surface has loading + empty + error.
- No new colour outside `design/figma-tokens.md`.
- Visual-regression baselines captured for all ~30 routes at 3 widths.

---

## 11. Owner decisions needed

| # | Question | Default if unanswered |
|---|---|---|
| U-1 | Retire the pixel-diff verify loop against the Figma frames? (§0) | **Blocking** — nothing past Phase 0 starts without this. |
| U-2 | `/portal/performance`: build the page or drop the nav item? | Drop the item in Phase 0, re-add when a page exists. |
| U-3 | Accept a headless-primitive dependency (Radix/Base UI) for dialog/popover/combobox a11y, or hand-roll? | Hand-roll `Dialog`/`Popover`, take the dep only for `Combobox`. |
| U-4 | Minimum supported width — is there a real phone use case for programme reps? | Design to 360px; it costs little once F4 lands. |
| U-5 | Sign off the derived scales (spacing/radius/elevation/weight) as tokens? | Ship as "derived, pending sign-off" like `--color-surface` already is. |
| U-6 | Reports: keep the disabled generator visible with an explanation, or hide it? | Keep visible with an explanation. |
| U-7 | Evaluation `Evaluate`/`Return` — wire them in this refactor or keep them disabled? | Keep disabled, with an explanation instead of a dead button. |

`09a-ui-refactor-screens.md` §F adds **U-8 … U-13** (assignment due dates, PDF preview vs forced
download, home-page content, the four standard reports, embedding PDFs from private buckets, and the
dead `/personnel` tile). None is blocking; all have stated defaults.

---

## 12. Risks

- **Scope**: ~30 routes, 32 kit files, 21 screen files. Mitigation is the phase split and API
  aliasing — every phase ships independently green.
- **Losing the client's approved look.** Mitigation: colours, fonts, type sizes and screen inventory
  are frozen; changes are spatial and behavioural. Capture before/after screenshots per screen for
  the client, per phase.
- **`zoom` removal is load-bearing.** Three separate zoom layers (`--portal-scale`, `--auth-scale`,
  `.brand-lockup`) interact, and `globals.css` documents a bug class where they only agree at 1440.
  Remove them together, at the end of Phase 4, not piecemeal.
- **Contrast fixes could look like recolouring.** They are not: every fix is weight, size, or
  swapping which frozen token is foreground (e.g. black-on-gold instead of white-on-gold).
- **Backend churn**: none planned, but form refactors touch server-action return shapes. Keep the
  old shape accepted for one phase.

---

## 13. Appendix — file inventory

**Rewrite**: `kit/DataTable.tsx`, `kit/Modal.tsx`, `kit/Field.tsx`, `kit/Button.tsx`,
`kit/EmptyState.tsx`, `PortalSidebar.tsx`, `PortalTopBar.tsx`, `NotificationBell.tsx`,
`auth/AuthShell.tsx`, `screens/ProgramRepSubmissions.tsx`,
`screens/InternalAccreditorEvaluationDetail.tsx`.

**Consolidate**: `kit/{DocumentBrowser,FolderGrid,DocFileGrid,CoverCard,FolderCard,DocCard}.tsx` →
`kit/FileBrowser.tsx` + `kit/{FolderCard,FileCard}.tsx`; `kit/{PanelHeader,CardTitleBar,
SectionHeading}.tsx` → `kit/PanelHeader.tsx`; `kit/RowList.tsx` → `DataTable` stacked variant;
`kit/DocTabs.tsx` → preset over new `kit/Tabs.tsx`; `kit/ViewToggle.tsx` → `kit/SegmentedControl.tsx`.

**New**: `kit/{Skeleton,Toast,ToastProvider,PageHeader,Tabs,Badge,Avatar,Tooltip,Popover,Alert,
Pagination,FileDropzone,DateField,Combobox,DescriptionList,SegmentedControl,VisuallyHidden,Spinner,
Dialog,ConfirmDialog}.tsx`; `components/portal/PortalPage.tsx`; `app/**/{loading,error,not-found}.tsx`;
`src/content/{about,campuses,recognitions}.ts`.

**Edit (tokens/infra)**: `src/app/globals.css`, `design/figma-tokens.md`, `src/app/layout.tsx`,
`src/app/portal/layout.tsx`, `src/components/portal/portal-nav.ts`, `eslint.config.mjs`.

**Every `page.tsx`** under `src/app/(public)`, `src/app/login`, `src/app/register`,
`src/app/portal` is touched in Phase 4 or 5 — 30 files.
