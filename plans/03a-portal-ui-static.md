# Phase 3a — Portal UI (static, no backend)

> **Read this before `03-auth-role-gate.md`.** The phase order changed on 2026-07-23: every
> portal screen is built as static UI from the owner's Figma **first**, and auth/database wiring
> (phase 3, effectively 3b) happens after. `03-auth-role-gate.md` still opens by calling itself
> blocked on a "per-role page inventory" — **that blocker is resolved**, see below.

## Goal

Build every screen of all four internal roles as static UI matching the owner's Figma. No
database, no auth, no API routes. When the backend lands later, the screens should not change —
only their data source.

## The blocker that no longer exists

Phase 3 sat blocked for two sessions on a "per-role page inventory" that was never missing: the
owner had the full Figma the whole time. The vocabulary ("inventory", "shell", "component kit")
stopped them from recognising what was being asked for. **Ask in plain words.** Before declaring
anything blocked, confirm the block is real and not a vocabulary mismatch.

## Source of truth

`assets/FIGMA/` — one folder per role, plus `_shared/` (sidebar/top bar and anything repeating on
every screen), `login/` and `register/`. **`register/` has its own per-role subfolders** — each
role registers differently — with any shared step of the flow directly in `register/`. See
`assets/FIGMA/README.md` for the export and naming conventions given to the owner. Files are
numbered in build order: `01-dashboard.png`, `02-my-programs.png`, …

**If a folder is empty, the owner has not exported it yet — ask, do not invent the screens.**

## Protocol — this is not optional

Same protocol that delivered the six public pages:

> Build one screen. Screenshot it live via Playwright. Show the owner. Wait for confirm or
> adjust. Then move to the next.

**Never batch several screens and screenshot at the end.** This was agreed for phase 2 and
restated on 2026-07-23.

## Build order

1. `login/` — the login screen. `assets/OTHERS/LOGIN.png` is its background photo (an aerial
   campus shot, not a mockup of the screen).
2. `_shared/` — the frame that persists across portal screens (sidebar / top bar). Take its nav
   items from a data array so they can vary per role.
3. Role by role, screen by screen, in the export's numeric order. Start with whichever role the
   owner names; `program_representative` was recommended (start of the workflow, smallest
   surface).
4. A **dev-only role switcher** so all four roles are clickable without real accounts. Must be
   trivially removable — it is a preview affordance, never an auth mechanism.

Fake data is typed directly into the files. Keep it in a clearly-named array per screen so the
swap point is obvious when the backend arrives.

## Decided — do not relitigate

- **Routes use a literal `/portal` segment, not a `(portal)` route group.** Verified in this repo:
  route groups contribute nothing to the URL, so `(portal)/accreditations/` collides with the
  public `accreditations/` and the dev server 500s with "two parallel pages resolve to the same
  path". `(public)` stays a group because it only needs a shared layout. Full reasoning in
  `03-auth-role-gate.md`. **`CLAUDE.md`'s structure section still describes the broken version and
  must be corrected.**
- **Role slug is `program_representative`** (owner chose it over `academic_representative` on
  2026-07-23). PRD.md, CLAUDE.md and the plans already use "Program Representative".
- **Missing portal colors are derived, then flagged.** `design/figma-tokens.md` has 5 colors and
  4 type sizes — it cannot dress a portal (no status-badge colors, no border, no hover, no
  disabled, and a large gap between 15px body and 36px title where table and form text lives).
  Derive from maroon `#800000` / yellow `#EFBF04` / gray `#7B7979`, record every addition in
  `figma-tokens.md` under a clearly-marked *derived, pending client sign-off* section. CLAUDE.md
  forbids inventing hex anywhere else — that section is the only sanctioned place.

## Required reading before the first screen

- `CLAUDE.md` — especially **never run git** (`add`/`commit`/`push`); print the command instead.
- `design/figma-tokens.md` — the token source of truth.
- `design/prototype-notes.md` — the screenshot-matching method (cap-height font recovery, the
  margin formula), plus Tailwind v4 and Next `<Image>` gotchas that cost real time on phase 2.
  **The `text-title` 1.5 line-height trap alone caused ~11px of drift per heading.**
- `.claude/session-state.md` — current state, loaded automatically at session start.

## Needed from the owner

- [x] ~~**Figma frame width**~~ — **settled: 1440x810, exported at 2x** (so a 2880x1620 PNG, and
      every measurement off it is halved). Recorded in `assets/FIGMA/README.md`.
- [ ] **The remaining exports.** As of 2026-07-23 the owner has full Figma access for every role;
      only `qac_personnel/` is on disk. This is an export step, not a client blocker.
- [ ] **Which role to build first.** `program_representative` recommended.
- [ ] Hover/open states, empty states, error states and modals as their own exported frames.
      Anything not exported gets invented and then reworked.

## How to execute this phase

[`03a-ui-build-runbook.md`](03a-ui-build-runbook.md) — the step-by-step procedure: the per-screen
loop, measurement rules, the verify setup, kit discipline, the identity seam, and the traps that
have already cost time. This file is the policy; that one is the method.

## Explicitly out of scope

Supabase client, middleware, RLS, API routes, real sessions, email, PDF processing. All of that is
phase 3 (`03-auth-role-gate.md`) and phases 7–8. Nothing `@supabase/*` is installed and no `.env*`
exists — keep it that way for this phase.

The `(public)` route migration is also **not** part of this phase. It is a single atomic change
described in `03-auth-role-gate.md`; doing it piecemeal alongside UI work will make the public
pages hard to verify.

## Done when

- Every screen in every populated `assets/FIGMA/<role>/` folder is built and confirmed by the
  owner against its export.
- All four roles are clickable end to end via the dev role switcher.
- Every color, font and size traces to `figma-tokens.md`, including the derived section.
- Layouts hold at mobile, tablet and desktop.
- No Supabase, database or API code exists in the repo.
