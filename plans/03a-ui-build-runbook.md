# Phase 3a — UI build runbook

Operational companion to [`03a-portal-ui-static.md`](03a-portal-ui-static.md). That file is the
*policy* (goal, scope, what's decided). **This file is the procedure** — read it start to finish
before touching a screen, then work the loop.

Goal: build every screen of all four internal roles as static UI matching the owner's Figma. No
database, no auth, no API routes. When the backend lands, the screens should not change — only
their data source.

## Read first (in this order)

1. `CLAUDE.md` — design-system rule, component-kit rule, and **never run git** (print the command).
2. `design/figma-tokens.md` — the only source of colors, fonts, sizes.
3. `design/prototype-notes.md` — matching method + the traps. Non-optional.
4. `.claude/session-state.md` — current state, loaded automatically at session start.
5. `assets/FIGMA/README.md` — export/naming conventions given to the owner.

## Step 0 — check what you actually have

```bash
find assets/FIGMA -type f ! -name '.gitkeep' | sort
```

Build only what is on disk. **An empty folder means the owner hasn't exported it — ask, don't
invent.** As of 2026-07-23 only `qac_personnel/` is populated (twelve frames, all built); the
owner has full Figma access and is exporting the rest.

Two screens are already linked from the sidebar but have no frame and currently **404**:
`/portal/performance` and `/portal/feedback`. Do not invent them.

## Step 1 — the per-screen loop

> Build one screen. Screenshot it live. Diff it. Show the owner. Wait for confirm or adjust.
> Then the next.

**Do not batch several screens and screenshot at the end.** This was agreed for phase 2, restated
2026-07-23, and then overridden by the owner for frames 02–06 — which measurably cost accuracy
versus the dashboard's per-screen loop. With three more roles that compounds.

Concession that works: build the **first screen of a new role one-at-a-time** to establish that
role's geometry family, then batch within the role once the paddings are known.

## Step 2 — measurement rules

- **Exports are 2x of a 1440x810 frame. Halve every measurement off the PNG.** Settled: halving
  lands the QAC wordmark on exactly 20px, nav labels 15, stat numerals 20, `LEVEL n` 12, top bar 59.
- **Recover font size from cap height, not ink runs:** `font-size ≈ capHeight / 0.727` for Inter.
  Ink runs vary with which glyphs a line contains; a flat-topped `T`/`F`/`H`/`M` is stable.
- **Cap-top to CSS margin:** `capTop = boxTop + (lineHeight − 1.21·fontSize)/2 + 0.242·fontSize`.
- **Snap to the nearest token when one exists**; use an arbitrary value only when none can serve,
  and flag it in `design/figma-tokens.md` under *derived, pending sign-off*. That section is the
  only sanctioned place for a value not already in the token list.
- Content padding differs per screen family — dashboard/assignment/events/reports 57px, document
  browser 74px, profile 81px. Measure it per family; do not assume.

## Step 3 — verify

Playwright at **viewport 1440x810, `deviceScaleFactor: 2`** → a 2880x1620 PNG, identical in size
to the export, so landmarks compare as raw integers.

```js
const page = await browser.newPage({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 2,
});
```

- `02.5-Campuses` needs height 988; `03`–`06` need 809.
- **Never measure a portal screen wider than 1440.** The shell zooms above that (see Traps), so a
  wider render is deliberately off-frame and every landmark will be wrong.
- Compare ink bounding boxes of named strings, not eyeballs.
- A whole-image pixel diff is a useful smoke test: resize both to 2880x1620 and count pixels
  differing >30/255. **~2.8% is the "antialiasing only" floor** (the dashboard). 4% is fine, 9%+
  means something structural — or, as on `02.6`, artwork that differs from what the designer used.
- `devIndicators: false` is already set in `next.config.ts` so the dev badge stops corrupting
  pixel scans.

## Step 4 — component kit discipline

Per `CLAUDE.md`: **if a piece of UI appears on more than one screen, it is a component.**

- Kit lives in `src/components/portal/kit/`, one file per component, re-exported from `index.ts`.
- **Read `kit/index.ts` before building any screen.** Reuse what's there; extend with a prop
  rather than forking a near-duplicate.
- The moment a second screen needs something a page has inline, move it to the kit and update the
  first screen. Never leave two copies.
- A kit component owns its own look. Pages pass data and variants, never `className` overrides.
- Existing kit: `BackLink`, `Breadcrumb`, `Button`, `Card`, `CoverCard`, `DataTable`,
  `DocumentBrowser`, `EmptyState`, `Field`, `FileCard`, `FolderCard`, `FolderGrid`,
  `MonthCalendar`, `PanelHeader`, `SearchField`, `SectionHeading`, `StatCard`, `Stepper`,
  `ViewToggle`.

**Keep formatting in components, not in fake data.** `Stat.note` is currently a finished sentence
("1.10% Since last month"); it should take `deltaPct` and compose in `StatCard`. Apply to new
components; retrofit existing ones opportunistically. This is what makes the eventual real-data
swap a data change instead of a rewrite.

All fake data lives in `src/components/portal/data.ts` — the single backend swap point.

## Step 5 — the identity seam (do this before the second role)

Today the signed-in user is a hardcoded constant at `src/components/portal/portal-nav.ts:59`, so
no other role is reachable without editing source. Replace it with one seam:

```
src/lib/current-user.ts          getCurrentUser() — server-only
src/components/portal/data.ts    PORTAL_USERS — one fake user per role
```

- `getCurrentUser()` reads a dev cookie (`qac_dev_user`), looks the key up in `PORTAL_USERS`,
  falls back to the `qac_personnel` default.
- The cookie holds a **user key, not a role** — the top bar shows name, position and avatar, so
  switching role alone would leave "Surname, Given Name M.I." on every role.
- `portal/layout.tsx` calls it and passes the user down as a prop. `PortalTopBar` and
  `PortalSidebar` both import the constant directly today and must change; the sidebar is
  `"use client"` (it needs `usePathname`), so it has to *receive* the user.
- Switching: a route handler `/portal/dev/switch?as=<role>&next=<path>` sets the cookie and
  redirects, plus a small control in the top bar gated on `NODE_ENV !== "production"`. Style it
  so it cannot be mistaken for a real feature, and keep it trivially removable — it is a preview
  affordance, never an auth mechanism.
- `PORTAL_NAV` at `portal-nav.ts:37` only defines `qac_personnel`. Until a role's frames land,
  its sidebar is empty by design — **say so in the switcher** rather than rendering a blank rail,
  or it reads as a bug.

Later this becomes `supabase.auth.getUser()` + `user.app_metadata.role` (never `user_metadata` —
users can edit their own). One function body changes.

## Step 6 — build order

1. `login/` — the login screen. `assets/OTHERS/LOGIN.png` is its background photo, not a mockup.
2. `register/` — sign-up, with **one subfolder per role** (`program_representative/`,
   `internal_accreditor/`, `qac_personnel/`, `qac_admin/`) because each role registers
   differently. Anything shared across the flow — a role picker, email verification, a "pending
   approval" screen — sits directly in `register/`, not in a subfolder.

   Build straight after login: they share layout, background and form controls, so doing them
   together is what puts those in the kit once instead of twice.

   **Build one role's registration screen fully, extract its form chrome to the kit, then do the
   other three.** The four almost certainly differ only in which fields they ask for; if you build
   all four inline you will have four copies of the same form to reconcile. This is the kit rule
   at its highest leverage — expect a `Field`-based form component and a shared auth-page shell
   (background, card, logo lockup) that `login/` also uses.
3. `_shared/` — confirm the sidebar/top bar are identical across roles (they were assumed to be,
   from `qac_personnel` alone).
4. The identity seam + dev switcher (Step 5).
5. Role by role, screen by screen, in the export's numeric order. `program_representative` was
   recommended as the first role — start of the workflow, smallest surface — but the owner picks.

`/login` is currently a 12-line stub at `src/app/login/page.tsx` and **there is no `/register`
route yet** — it needs creating. The public Navbar links to `/login` only (`Navbar.tsx:161`); if
registration should be reachable from the public site, that link needs adding too. Ask.

Per-role checklist, tick as frames land and screens ship:

| Role | Frames exported | Screens built | Owner confirmed |
|---|---|---|---|
| `login` | ☐ | ☐ | ☐ |
| `register` (shared steps) | ☐ | ☐ | ☐ |
| `register/program_representative` | ☐ | ☐ | ☐ |
| `register/internal_accreditor` | ☐ | ☐ | ☐ |
| `register/qac_personnel` | ☐ | ☐ | ☐ |
| `register/qac_admin` | ☐ | ☐ | ☐ |
| `_shared` | ☐ | ☐ | ☐ |
| `qac_personnel` | ✅ 12 | ✅ 12 | ☐ |
| `program_representative` | ☐ | ☐ | ☐ |
| `internal_accreditor` | ☐ | ☐ | ☐ |
| `qac_admin` | ☐ | ☐ | ☐ |

## Traps that have already cost real time

- **Tailwind v4 gives `text-title` a 1.5 line-height (54px); the prototypes use ~1.2.** Every
  heading needs explicit `leading-[1.2]` or the page drifts ~11px per heading. Biggest single
  source of vertical error on phase 2.
- **The portal shell zooms** — `portal-scale` in `globals.css`, applied in `portal/layout.tsx`,
  `clamp(1, tan(atan2(100vw,1440px)) * 0.9, 2)`. The `*0.9` is the owner's deliberate damping.
  Consequence for this runbook: **scale is 1 only at ≤1440 wide.** Also, `zoom` does not rescale
  viewport units — that's why the utility owns `height: calc(100dvh / var(--portal-scale))` and
  why `h-screen` must not go back on the shell.
- **Next `<Image>`: `width`/`height` must be the file's TRUE pixel size**, or artifacts bake into
  the cached WebP. After changing a file in `public/`, `rm -rf .next/dev/cache/images`.
- **The image cache only holds images from the most recent user message.** Measure a batch of
  exports the moment it lands; eyeballing a render is good to ±10px, not enough for margin work.
- **JSX silently eats spaces** around `</strong>`. Putting copy in string arrays sidesteps it.
- Lazy images below the fold are blank in a fullPage screenshot unless you scroll first, then
  `waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0))`.
- Line breaks drift ~1 word from the prototype in places — font-metric drift between renderers,
  not container width. Regular text also renders ~3% narrower than the prototype in Chrome. Both
  accepted; do not chase.
- Portal bold is `font-semibold` (600), except stat numerals and the Poppins wordmark (700).

## Explicitly out of scope

Supabase client, middleware, RLS, API routes, real sessions, email, PDF processing — all phase 3b
(`03-auth-role-gate.md`) and phases 7–8. Nothing `@supabase/*` is installed and no `.env*` exists;
keep it that way.

The `(public)` route-group migration is **not** part of this phase either. It is a single atomic
change described in `03-auth-role-gate.md`, and doing it piecemeal alongside UI work makes the
public pages hard to verify. It also deletes the `SiteChrome.tsx` shim.

## Done when

- Every screen in every populated `assets/FIGMA/<role>/` folder is built and confirmed by the
  owner against its export.
- All four roles are clickable end to end via the dev role switcher.
- Every color, font and size traces to `figma-tokens.md`, including the derived section.
- No Supabase, database or API code exists in the repo.

## Ask the owner as you go

Collect schema-shaped questions in plain English — they cost nothing now and a UI assumption that
contradicts the real model is a rebuild, not a rewire. Open already:

- **Registration is per-role — so how does a registrant prove they're entitled to that role?**
  Four separate sign-up forms means something has to stop a stranger opening the `qac_admin` one.
  The usual answers are admin invite links, a domain-restricted email, or self-signup that lands
  in a "pending approval" state an admin promotes. **This is a UI-visible decision** — it changes
  whether the screens need an invite-token field, a verification step, or a post-submit waiting
  screen. Ask before building the forms, not after.
  Related: the role must never be settable by the user at signup (that is the `user_metadata`
  escalation the auth plan warns about), so whatever the frames show, the role has to be pinned
  by the route or the invite, not by a field the user controls.
- **What URL shape do the four registration screens take** — `/register/[role]`, four literal
  paths, or one `/register` with a role step? Affects routing before any screen is built.
- Can one person hold two roles (QAC Personnel who also represents a program)? Changes whether
  role is a column or a join table, and every RLS policy after it.
- One accreditation per program, or many cycles?
- Are Program Representatives scoped to one program or several?
- Do accreditors see only assigned accreditations, or all read-only?
- Hover/open states, empty states, error states and modals as their own exported frames —
  anything not exported gets invented, then reworked.
