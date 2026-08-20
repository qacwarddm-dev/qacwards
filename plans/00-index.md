# QAC Wards — Roadmap

Single repo, single domain, Next.js App Router with `(public)` / `(portal)` route groups. See `../CLAUDE.md` for stack and `../design/figma-tokens.md` for colors/fonts.

## Phases

| # | Phase | File | Depends on | Status |
|---|---|---|---|---|
| 1 | Shell (scaffold, navbar, footer) | [01-shell.md](01-shell.md) | — | **Done** |
| 2 | Public view (marketing pages) | [02-public-view.md](02-public-view.md) | 1 | **Done** — revisions expected, see file |
| 3a | **Portal UI — static, no backend** | [03a-portal-ui-static.md](03a-portal-ui-static.md) · [runbook](03a-ui-build-runbook.md) | 1 | **Current focus** — `qac_personnel` built (12 screens); rest awaiting export |
| 3b | Auth + role gate | [03-auth-role-gate.md](03-auth-role-gate.md) | 3a | Spec'd — starts after 3a |
| 4 | Program Rep portal | [04-program-rep-portal.md](04-program-rep-portal.md) | 3 | Not started |
| 5 | Internal Accreditor portal | [05-accreditor-portal.md](05-accreditor-portal.md) | 4 | Not started |
| 6 | QAC Personnel/Admin portal | [06-personnel-admin-portal.md](06-personnel-admin-portal.md) | 5 | Not started |
| 7 | Calendar / visit scheduling | [07-calendar.md](07-calendar.md) | 6 | Not started |
| 8 | Audit log + polish + deploy | [08-audit-deploy.md](08-audit-deploy.md) | 7 | Not started |
| 9 | **UI/UX refactor — strategy, foundations, phases** | [09-ui-refactor.md](09-ui-refactor.md) | after 8 | Planned, blocked on owner decision U-1 |
| 9a | UI/UX refactor — per-screen specs (every route) | [09a-ui-refactor-screens.md](09a-ui-refactor-screens.md) | 9 | Planned |
| 9b | UI/UX refactor — design system spec (tokens, APIs) | [09b-design-system.md](09b-design-system.md) | 9 | Planned |

## Known blockers

- ~~Real logo/icon assets not delivered~~ — resolved. `assets/LOGO/` has PUP, QAC, Republika ng Pilipinas, AACCUP, CHED. Copied to `public/assets/logos/`; no text-wordmark fallback was needed. `assets/ICONS/` is still empty, covered by lucide-react.
- ~~Phase 2 page copy comes from project-owner screenshots~~ — resolved, all six pages transcribed.
- **Phases 1–2 are done but not frozen.** Items still open with the client can send public pages back for rework — token gaps, asset re-exports, prototype navbar reconciliation. Listed in `02-public-view.md` and `.claude/session-state.md`.
- **The `(portal)` route group described below and in `CLAUDE.md` does not namespace URLs.** Verified 2026-07-22: a route group contributes nothing to the path, so a portal `/accreditations` collides with the public one and fails the build. Phase 3 replaces it with a literal `/portal` segment — see `03-auth-role-gate.md`. `CLAUDE.md` still needs correcting.
- ~~**Blocking phase 3:** the per-role page inventory~~ — **resolved 2026-07-23.** It was never missing: the owner has the full Figma for every page of every role. Exports go in `assets/FIGMA/<role>/`. Nothing in the repo describes the portal (`plans/04`–`08` and `sample.md` are empty, the docx holds only colors/fonts/type scale, and `PRD.md:114` wrongly calls `assets/OTHERS/` "page mockups" when those files are photos) — **the Figma is the only source.**
- **Phase order changed 2026-07-23:** all portal UI is built static from the Figma (3a) *before* any auth or database wiring (3b). See [03a-portal-ui-static.md](03a-portal-ui-static.md).
- **UI-first reconfirmed 2026-07-23**, with a second reason: the client's database and full system flow are still unknown, so schema and RLS written now would be guesswork — and RLS is the most expensive thing to redo, since policies touch every table and every per-role test. Screens are cheaper to rebuild than policies.
- ~~**Figma frame width unknown**~~ — resolved 2026-07-23: **1440x810, exported at 2x.** Recorded in `assets/FIGMA/README.md`; halve every measurement taken off a PNG.
- **The only real blocker left in 3a is the export itself.** The owner has Figma access to every role's frames; `login/`, `register/`, `_shared/`, `qac_admin/`, `internal_accreditor/` and `program_representative/` are empty folders awaiting a drop. `DesignSync` is not a Figma bridge (it targets claude.ai design-system projects) — frames cannot be pulled programmatically.
- Phases 4–8 still have empty spec files.
- **Phase 9 is blocked on one owner decision (U-1).** The portal is a pixel-diff-verified 1:1 of the
  1440x810 Figma frames; a responsive, accessible UI cannot also be that. The refactor assumes the
  diff loop is retired and the prototype becomes brand reference, not spec. Colours, fonts and type
  sizes stay frozen either way. Phase 9's own sub-phases 0 and 6 are prototype-neutral and ship
  regardless.
- **Two dead links found 2026-08-20**: BUG-6 `/portal/performance` (in the QAC Personnel rail,
  inherited by QAC Admin, no route exists) and BUG-7 `/personnel` (the home page's "Personnels"
  tile). Both are Phase 9.0 items.

## Roles (5)

Public, QAC Personnel, QAC Admin, Internal Accreditor, Program Representative.
