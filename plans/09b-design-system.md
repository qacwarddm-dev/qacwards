# 09b — Design System Spec

The buildable half of `plans/09-ui-refactor.md` §3–§4: exact values, exact APIs, exact rules.
Nothing here invents a colour, a font or a type size — those are frozen at what
`design/figma-tokens.md` already holds. Everything added is spatial, structural or behavioural, and
lands in that file's **"Derived — pending client sign-off"** section with its derivation.

---

## 1. Token additions — `src/app/globals.css`

Appended inside the existing `@theme` block, after the derived colours.

```css
  /* --- Spacing. 4px base. Every value below is the nearest step to a cluster
     of measured px already in the codebase — [10px]x57 -> 12, [16px]x51 -> 16,
     [20px]x48 -> 20, [18px]x36 -> 16, [14px]x36 -> 16, [22px]x26 -> 24. The
     mapping table is in design/figma-tokens.md so the snap is on the record. */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 56px;
  --space-11: 64px;
  --space-12: 80px;

  /* --- Radius. Collapses rounded-[5|10|14|16|20]px + rounded-lg to four. */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* --- Elevation. --shadow-card stays (it is a signed-off token) and becomes
     --elev-2's value, so no existing call site changes meaning. */
  --elev-0: none;
  --elev-1: 0 1px 2px rgba(0, 0, 0, 0.06);
  --elev-2: 0 2px 8px rgba(0, 0, 0, 0.1);
  --elev-3: 0 12px 32px rgba(0, 0, 0, 0.16);

  /* --- Motion. */
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-inout: cubic-bezier(0.4, 0, 0.2, 1);

  /* --- Layout. */
  --page-max: 1440px;
  --content-max: 1180px;
  --prose-max: 68ch;
  --rail-w: 250px;
  --rail-w-collapsed: 72px;
  --bar-h: 80px;
  --focus-ring: 2px;
  --focus-offset: 2px;

  /* --- Surface alphas. Derived from frozen tokens only — no new hex. */
  --hairline: color-mix(in srgb, var(--color-gray) 25%, transparent);
  --hairline-strong: color-mix(in srgb, var(--color-gray) 45%, transparent);
  --tint-maroon: color-mix(in srgb, var(--color-maroon) 8%, white);
  --tint-yellow: color-mix(in srgb, var(--color-yellow) 14%, white);
  --tint-approved: color-mix(in srgb, var(--color-approved) 12%, white);
```

### Responsive page gutter

```css
:root {
  --page-gutter: clamp(16px, 4vw, 64px);
  --panel-pad: var(--space-6);
}
@media (min-width: 1024px) {
  :root { --panel-pad: var(--space-7); }
}
```

### Global base rules (new, replacing the zoom layers)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible {
  outline: var(--focus-ring) solid var(--color-maroon);
  outline-offset: var(--focus-offset);
  border-radius: inherit;
}

/* Maroon on maroon is invisible — the sidebar, top bar and banner invert. */
.on-maroon :where(a, button, [tabindex]):focus-visible {
  outline-color: var(--color-yellow);
}

::selection { background: var(--tint-yellow); }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

### Deletions (end of Phase 4)

`@property --portal-scale`, `@property --auth-scale`, `.portal-scale`, `.auth-scale`, and the
`min(var(--portal-scale), 1.6)` inside `.brand-lockup`. The `.brand-lockup` breakpoint steps
(0.55 / 0.72) survive as plain responsive sizing.

---

## 2. Type ramp

Implemented as utility classes in `globals.css` (`@utility`), not as per-call Tailwind stacks. This
kills the single biggest source of vertical drift in the codebase — `design/prototype-notes.md`
records that every heading currently needs a hand-written `leading-[1.2]` or the page slips ~11px.

| Utility | Size token | Weight | Leading | Tracking | Used for |
|---|---|---|---|---|---|
| `.t-display` | `--text-title` 36 | 700 | 1.15 | -0.01em | Public hero, stat numerals |
| `.t-banner` | `--text-banner` 31 | 600 | 1.2 | -0.01em | Dashboard/login banner |
| `.t-h1` | `--text-heading` 20 | 700 | 1.25 | 0 | Page title |
| `.t-h2` | `--text-subheading` 15 | 700 | 1.3 | 0 | Panel title |
| `.t-h3` | `--text-regular` 12 | 700 | 1.3 | 0.02em | Sub-panel title |
| `.t-eyebrow` | `--text-regular` 12 | 700 | 1.2 | 0.08em | All-caps section label |
| `.t-body` | `--text-subheading` 15 | 400 | 1.55 | 0 | Body copy |
| `.t-body-strong` | `--text-subheading` 15 | 600 | 1.55 | 0 | Emphasis in body |
| `.t-sm` | `--text-regular` 12 | 400 | 1.45 | 0 | Table cells, help text |
| `.t-meta` | `--text-small` 10 | 500 | 1.4 | 0.02em | Timestamps, captions |
| `.t-micro` | `--text-micro` 9 | 500 | 1.3 | 0.02em | **Non-essential only** — gridline numerals. Never for text a user must read (fails AA). |

Font-family assignment is unchanged: `--font-main` everywhere, `--font-pup` / `--font-qac` in
`BrandLockup` only, `--font-footer` in `Footer`, `--font-status` on the public accreditation-status
band. No new family, no family moved.

---

## 3. Layout system

### Breakpoints
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. The portal is **designed at 1280**, not 1440.

### Portal shell responsive contract

| Width | Rail | Content | Top bar |
|---|---|---|---|
| `< 768` | Off-canvas drawer, focus-trapped, Escape closes | 1 column, `--page-gutter` 16px | Hamburger + lockup + bell + avatar |
| `768–1023` | 72px icon rail, tooltips on hover/focus | 1–2 columns | Full |
| `1024–1279` | 250px rail | 2 columns | Full |
| `≥ 1280` | 250px rail, collapsible by user (persisted in `localStorage`) | Up to 3 columns, content capped at `--content-max`, centred | Full |

### Grid primitives (kit)

- `<Stack gap>` — vertical flow, the default for page sections.
- `<Row gap wrap align>` — horizontal.
- `<Grid min="280px" gap>` — `repeat(auto-fit, minmax(min, 1fr))`. This one component replaces
  every hand-tuned card grid: the 22-card Campuses flex-wrap, the 4-up document grid
  (`grid-cols-4 gap-x-[27px]`), the officials rows (1/2/4/3/3 with `gap-x-[106px]`/`[130px]`).
- `<Split left right leftMin rightW stackAt>` — the dashboard's "flexible left + fixed right"
  pairing, currently re-declared on every dashboard as `flex-1` + `w-[450px]`.

### Container queries

Kit components size themselves off their container, not the viewport:
`Card`, `StatCard`, `FolderCard`, `FileCard`, `MiniCalendar`, `DataTable` (stack threshold).
Declared as `@container` on the component root so a card in a 1-col page and the same card in a
3-col page need no page-level prop.

---

## 4. Surface & elevation rules

1. A page has **one** background: `--color-surface` in the portal, white on the public site.
2. A panel sits on it at `--elev-1`, rising to `--elev-2` only when it is interactive and hovered.
3. **A surface inside a surface gets `--elev-0` and a `--hairline` border, never a second shadow.**
   This is the rule that unwinds Profile's card→panel→field nesting and Reports' card→empty state.
4. Dialogs and popovers are `--elev-3`. Nothing else is.
5. Dividers are `1px solid var(--hairline)`. Never a 2px rule, never a coloured one.

---

## 5. Motion spec

| Moment | Property | Duration | Easing |
|---|---|---|---|
| Hover/press on control | `background`, `color`, `box-shadow` | `--motion-fast` | `--ease-out` |
| Card hover lift | `box-shadow`, `translateY(-1px)` | `--motion-base` | `--ease-out` |
| Dialog / popover in | `opacity`, `scale(.98→1)` | `--motion-base` | `--ease-out` |
| Dialog / popover out | `opacity` | `--motion-fast` | `--ease-in` |
| Drawer (mobile rail) | `translateX` | `--motion-slow` | `--ease-inout` |
| Toast in | `translateY(8px→0)`, `opacity` | `--motion-base` | `--ease-out` |
| Page-load stagger | `opacity`, `translateY(6px→0)`, 40ms per block, max 6 blocks | `--motion-base` | `--ease-out` |
| Skeleton | `opacity` pulse 1.4s, or a masked shimmer | — | `--ease-inout` |
| Accordion / row expand | `grid-template-rows: 0fr→1fr` | `--motion-base` | `--ease-out` |
| Value change (counters) | `tabular-nums`, no animation | — | — |

Rules: never animate `width`/`height`/`top`/`left`; never animate on data refetch (only on mount and
on user intent); never exceed `--motion-slow`; everything above is off under
`prefers-reduced-motion`. `View Transitions` API for portal route changes is optional and gated
behind support detection — the skeletons must stand alone without it.

---

## 6. Iconography

Lucide, three sizes only: **16** (inline with `t-sm`), **20** (buttons, list rows), **24** (nav,
empty states). Stroke `1.75` everywhere; the current codebase mixes `1.25`, `2`, `2.5` and sizes
`14`, `18`, `20`, `29`, `33`. Icons are `aria-hidden` unless they are the only content of a control,
in which case the control gets an `aria-label`. Icon-only buttons are ≥ 32x32 hit area (WCAG 2.2
§2.5.8 asks 24; 32 is the house floor).

---

## 7. Data display conventions

Centralised in `src/lib/format.ts` so no screen invents its own:

- **Dates**: `20 Aug 2026` (list), `20 Aug 2026, 3:04 PM` (detail), relative under 24h (`3h ago`)
  with the absolute value in `title`. Asia/Manila, always; `<time dateTime>` always.
- **Numbers**: `tabular-nums` in every table and stat. Thousands separated. Percentages integer.
- **Names**: person as stored; role labels come from one map (`program_representative` → "Academic
  Program", per O-4) so the current per-screen mapping cannot drift.
- **Empty values**: em dash `—`, never blank, never `null`, never `N/A`.
- **Truncation**: one line with `title` + `text-ellipsis` in tables; two-line clamp in cards; never
  in a heading.
- **File sizes**: `1.2 MB`, one decimal, binary units.
- **Status**: always pill + word. Never colour alone.

---

## 8. Copy rules

- Buttons are verbs and specific: `Upload document`, not `Submit`. Destructive buttons name the
  object: `Close cycle`, `Remove photo`.
- Errors say what happened, why, and the next step: *"That file is 24 MB. The limit is 10 MB —
  compress it or split it into two documents."* Never *"Upload failed."*
- Empty states say what belongs here and how to put it there, with the action inline.
- Never blame the user; never expose an error code without a human sentence beside it.
- Sentence case everywhere except `.t-eyebrow` section labels, which are ALL CAPS by design.
- The system calls itself **QAC-WARDS**; the office is the **Quality Assurance Center**.

---

## 9. Component APIs

Signatures for everything new or rewritten. Existing props keep their names wherever the behaviour
survives, so migration is mechanical.

```ts
// --- Primitives -----------------------------------------------------------
Skeleton({ w?, h?, radius?, lines?, className? })
Spinner({ size?: 16|20|24, label?: string })
VisuallyHidden({ children })

// --- Feedback -------------------------------------------------------------
type Toast = { id: string; tone: "info"|"success"|"warning"|"error";
               title: string; description?: string;
               action?: { label: string; onClick: () => void }; duration?: number };
useToast(): { push(t: Omit<Toast,"id">): void; dismiss(id: string): void };
Alert({ tone, title, children?, action?, onDismiss? })   // inline, page-level

// --- Actions --------------------------------------------------------------
Button({
  variant?: "primary"|"secondary"|"ghost"|"danger"|"link",
  size?: "sm"|"md"|"lg",
  loading?: boolean,          // spinner + aria-busy + disabled
  iconStart?: LucideIcon, iconEnd?: LucideIcon,
  href?: string, full?: boolean, ...ButtonHTMLAttributes
})
// Deprecated aliases kept for one phase: solid→primary, outline→secondary,
// muted→primary+disabled-look, yellow→(case by case), ghost→ghost.
IconButton({ icon, label, size?, variant?, ...})

// --- Forms ----------------------------------------------------------------
type FieldBase = { label: string; hint?: string; error?: string;
                   required?: boolean; disabled?: boolean; id?: string };
TextField(FieldBase & InputHTMLAttributes)
PasswordField(FieldBase & { strength?: boolean; requirements?: string[] })
TextareaField(FieldBase & { rows?: number; maxLength?: number; counter?: boolean })
SelectField(FieldBase & { options: {value,label,disabled?}[]; placeholder? })
Combobox<T>(FieldBase & { items: T[]; itemToLabel; itemToValue;
                          onSearch?; loading?; emptyMessage?; multiple? })
DateField(FieldBase & { min?, max?, value?, onChange? })
RadioCardGroup<T>(FieldBase & { options: {value,label,description?,icon?}[] })
FileDropzone({ accept, maxSizeMB, multiple?, onFiles, files?, onRemove?, onRetry? })
Form({ action, children })      // <form> + error summary + dirty guard

// --- Data display ---------------------------------------------------------
DataTable<Row>({
  columns: Column[], rows: Row[],
  caption: string,                       // required — screen-reader table name
  sort?: { key, dir, onChange },
  selection?: { selected: string[], onChange, bulkActions? },
  empty?: ReactNode, loading?: boolean,  // renders skeleton rows
  stackAt?: "sm"|"md"|"never",           // card-per-row below the breakpoint
  stickyHeader?: boolean,
  rowHref?: (row) => string, rowActions?: (row) => ReactNode,
  pagination?: DataTablePagination, density?: "comfortable"|"compact"
})
Column = { key, header, width?, align?, sortable?, hideBelow?: "sm"|"md"|"lg",
           cell?: (row) => ReactNode, headerHint?: string }

DescriptionList({ items: { label, value, hint?, action? }[], columns?: 1|2|3 })
StatCard({ label, value, delta?, deltaLabel?, icon?, href?, loading?, tone? })
StatusPill({ status: StatusKey, size?: "sm"|"md", dotOnly?: boolean })
Badge({ tone, children })
Avatar({ src?, name, size?: 24|32|40|64, ring? })
Pagination({ mode: "keyset"|"page", ...hrefs, total?, pageSize? })
EmptyState({ variant: "empty"|"no-results"|"error"|"locked",
             title, description?, action?, icon?, illustration?, size? })

// --- Navigation & structure ----------------------------------------------
PageHeader({ title, description?, breadcrumb?, actions?, tabs?, meta? })
PortalPage({ title, description?, breadcrumb?, actions?, tabs?, children, width? })
Tabs({ tabs: {key,label,count?,icon?}[], value, onChange | hrefFor, variant? })
SegmentedControl({ options, value, onChange, size? })
Breadcrumb({ crumbs: Crumb[], collapseAfter?: number })
Stepper({ steps, current, orientation?: "horizontal"|"vertical",
          onStepClick?, status?: (i) => "done"|"current"|"blocked"|"skipped" })

// --- Overlays -------------------------------------------------------------
Dialog({ open, onOpenChange | closeHref, title, description?, size?,
         footer?, children, initialFocus? })     // trap + Escape + scroll lock
ConfirmDialog({ open, onOpenChange, title, description, confirmLabel,
                tone?: "danger"|"default", requireReason?: boolean, onConfirm })
Popover({ trigger, children, placement?, matchTriggerWidth? })
Tooltip({ content, children, placement? })       // never the only carrier of info
Drawer({ open, onOpenChange, side?, children })

// --- Domain composites ----------------------------------------------------
FileBrowser({ breadcrumb, folders, files, view, onViewChange, search,
              sort, onUpload?, onSelect?, empty, loading })
FolderCard({ name, count?, href, preview?, menu? })
FileCard({ name, type, size?, updatedAt?, status?, href, menu? })
SubmissionTimeline({ events: { at, actor, action, note? }[] })
```

### Status registry (single source, `src/components/portal/kit/status.ts`)

```ts
export const STATUS = {
  // documents
  pending:        { label: "Pending",        tone: "warning" },
  approved:       { label: "Approved",       tone: "success" },
  disapproved:    { label: "Disapproved",    tone: "danger"  },
  // submissions
  draft:          { label: "Draft",          tone: "neutral" },
  submitted:      { label: "Submitted",      tone: "info"    },
  under_review:   { label: "Under review",   tone: "info"    },
  returned:       { label: "Returned",       tone: "warning" },
  // assignments (enum order: assigned → in_progress → for_psv → evaluated → score_returned)
  assigned:       { label: "Assigned",       tone: "info"    },
  in_progress:    { label: "In progress",    tone: "info"    },
  for_psv:        { label: "For PSV",        tone: "warning" },
  evaluated:      { label: "Evaluated",      tone: "success" },
  score_returned: { label: "Score returned", tone: "success" },
  declined:       { label: "Declined",       tone: "danger"  },
  // cycles / accounts / NDA
  open:           { label: "Open",           tone: "success" },
  closed:         { label: "Closed",         tone: "neutral" },
  active:         { label: "Active",         tone: "success" },
  disabled:       { label: "Disabled",       tone: "neutral" },
  signed:         { label: "Signed",         tone: "success" },
  unsigned:       { label: "Not signed",     tone: "warning" },
} as const;
```

Tones map to frozen tokens only: `success`→`--color-approved`, `warning`→`--color-yellow` **with
black text**, `danger`→`--color-maroon`, `info`→`--color-holiday`, `neutral`→`--color-gray`.
The `warning` foreground swap is the white-on-gold contrast fix (§8 of `09-ui-refactor.md`).

---

## 10. Form & mutation contract

```ts
type ActionResult<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
```

- One Zod schema per form, imported by both the client (`onBlur` + submit validation) and the
  server action (authoritative). No duplicated rules.
- `useActionState` + `useFormStatus`; every submit button gets `loading` from it.
- `fieldErrors` render inline on the field (`aria-invalid` + `aria-describedby`); `message` renders
  as a toast on success and as an `Alert` above the form on failure.
- Forms with unsaved changes register a `beforeunload` + router guard (`RepMapper`, `CycleManager`,
  `Profile`, `QacPersonnelCreateAssignment`).
- Destructive actions always route through `ConfirmDialog`, never a bare button.

---

## 11. URL as state

Already the house convention (`?tab=`, `?program=`, `?view=`, `?phase=`, `?modal=`, `?before=&id=`).
Formalised in `src/lib/url-state.ts`: typed `useQueryState(key, parser)` helpers, shallow updates,
and a single `buildHref` so no screen hand-concatenates params again. Search, sort, filters,
pagination, tabs and dialogs are all URL state. Component state is only for transient UI (open
menus, in-flight text before debounce).

---

## 12. Enforcement

`eslint.config.mjs` additions:

- `eslint-plugin-jsx-a11y` at `recommended`, plus errors on `no-autofocus` exceptions,
  `anchor-is-valid`, `click-events-have-key-events`, `no-noninteractive-element-interactions`.
- Custom `no-restricted-syntax` rule: **arbitrary Tailwind px in `src/components/portal/**` and
  `src/app/portal/**`** (`/\[[0-9.]+px\]/` in a `className` literal) — the token scales are the only
  legal source. Allowlist file for the handful of genuinely one-off geometry values, each requiring
  a comment.
- `no-restricted-syntax` on raw hex in `className`/`style` — colours come from tokens.
- `no-restricted-imports`: pages may not import from `kit/*` internals, only `kit/index.ts`.

CI adds: `tsc --noEmit`, `eslint`, `next build`, `axe` over the route list, and Playwright visual
snapshots at 375 / 768 / 1280 / 1920.

---

## 13. Definition of done, per component

A kit component is done when it has: all five interaction states; a `loading` and an `empty` path
where it displays data; keyboard operation with a visible focus ring; correct ARIA; container-query
responsiveness; no arbitrary px; a doc comment stating what it is for and which screens use it; and
a story//example route entry in the kit gallery (`/portal/dev/kit`, dev-only, deleted at release).
