# QAC Wards — Product Requirements

Status: draft · Last updated: 2026-07-21

Accreditation workflow system for the PUP Quality Assurance Center. Public-facing
information site plus role-gated internal portals that move a program through its
accreditation lifecycle (document submission → internal review → accreditor visit →
status publication), with an audit trail behind it.

This document is the agreed baseline. Phase detail lives in `plans/`, design values in
`design/figma-tokens.md`. Where the two disagree, this file records which one is current.

---

## 1. Scope

### In scope

- Single Next.js app, single domain, serving both the public site and all internal portals.
- Five roles (below), each with its own portal surface.
- Document upload/validation with a UUID stamped into the PDF.
- Visit scheduling on a shared calendar.
- Audit log of state transitions.

### Out of scope (unless later agreed)

- Native mobile apps.
- Public self-registration — accounts are provisioned by QAC Admin.
- Payments, SIS/registrar integration.

### Not yet specified

`plans/03`–`plans/08` are empty stubs. Auth details, the three portals, calendar, and
audit/deploy have a headline and a dependency order only. Their requirements must be
written before those phases are estimated or built.

---

## 2. Roles

| Role | Access |
|---|---|
| Public | Unauthenticated. Marketing/about pages, published accreditation status. |
| Program Representative | Submits program documents, tracks own program's progress. |
| Internal Accreditor | Reviews submitted documents, records findings. |
| QAC Personnel | Operates the workflow day to day. |
| QAC Admin | Personnel role plus account provisioning and configuration. |

Exact per-role permissions are TBD — pending `plans/03`.

---

## 3. Tech stack (agreed)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + React | Frontend and backend in one app; API Routes for server work. |
| Language | TypeScript | |
| Package manager | pnpm | |
| Styling | Tailwind CSS v4 | CSS-first `@theme` in `globals.css`. Supersedes the `tailwind.config.ts` wording in `plans/01-shell.md:15` and `design/figma-tokens.md:36` — same class names, different declaration site. |
| Icons | lucide-react | One set only. `assets/ICONS/` is empty, so no custom icon assets to honour. |
| Database | PostgreSQL | Application data **and** audit logs. Workflow state persists here, not in XState. |
| File storage | Supabase Storage | Uploaded accreditation documents. |
| Auth | Supabase Auth | Multi-role, RLS-backed. |
| Workflow engine | XState | Transition and guard logic only. |
| PDF read/validate | pdf-parse | |
| PDF write | pdf-lib | Stamps document UUID into the file. |
| Email | SMTP via nodemailer | |
| Calendar UI | react-big-calendar | |
| Hosting | Vercel | |

### Repo layout

```
src/app/
  (public)   — marketing/about, no auth
  (portal)   — role-gated: middleware + Supabase Auth session/role claim
public/assets/logos/
design/figma-tokens.md
assets/                — client-delivered source art (not web-served as-is)
plans/                 — per-phase specs
```

Route groups `(public)` / `(portal)` are created when phase 3 needs them; phase 1 ships a
flat `src/app`.

---

## 4. Design system

`design/figma-tokens.md` is the single source of truth for colors, fonts, and type sizes.
No hex value, font family, or px size may be introduced outside it. Read it before building
any component.

Summary (authoritative copy stays in that file):

- Colors: white `#FFFFFF`, black `#000000`, maroon `#800000` (brand), yellow `#EFBF04`
  (accent), gray `#7B7979` (muted).
- Fonts: Inter (body), Playfair Display SC ("PUP" wordmark), Poppins ("QAC" wordmark),
  Inria Serif (footer), Roboto Serif (accreditation status heading).
- Type scale: 36 title / 20 heading / 15 subheading / 12 regular.

All five families are available on Google Fonts and load via `next/font/google`. The
`next/font/local` fallback contemplated in `plans/01-shell.md:16` is not needed.

### Asset status — correction to plans

`plans/00-index.md:20` and `plans/01-shell.md:22` list the logo/seal art as an open blocker
requiring a text-wordmark fallback. **That blocker is resolved.** `assets/LOGO/` contains
`PUP.png`, `QAC.png`, `REPUBLIKA NG PILIPINAS.png`, `AACCUP.png`, `CHED.png`, and a
`COLLEGES/` subfolder. Real graphics are used from phase 1; no fallback wordmark is built.

Other delivered art: `assets/IMAGERY/` (page hero images), `assets/CAMPUSES/` (22 campus
photos), `assets/EMPLOYEES/`, `assets/OTHERS/` (page mockups incl. `LOGIN.png`).

---

## 5. Phases

Dependency order per `plans/00-index.md`.

| # | Phase | Spec | Depends on | State |
|---|---|---|---|---|
| 1 | Shell — scaffold, navbar, footer | `plans/01-shell.md` | — | Specced, not started |
| 2 | Public view — 6 marketing pages | `plans/02-public-view.md` | 1 | Specced, content copy blocked |
| 3 | Auth + role gate | `plans/03-auth-role-gate.md` | 1 | **Empty stub** |
| 4 | Program Rep portal | `plans/04-program-rep-portal.md` | 3 | **Empty stub** |
| 5 | Internal Accreditor portal | `plans/05-accreditor-portal.md` | 4 | **Empty stub** |
| 6 | QAC Personnel/Admin portal | `plans/06-personnel-admin-portal.md` | 5 | **Empty stub** |
| 7 | Calendar / visit scheduling | `plans/07-calendar.md` | 6 | **Empty stub** |
| 8 | Audit log + polish + deploy | `plans/08-audit-deploy.md` | 7 | **Empty stub** |

### Phase 1 — Shell

Scaffold the app and build the chrome every page reuses.

- Sticky navbar, white background: logo lockup left (PUP line + QAC line, fonts split per
  tokens), nav links Home / About (dropdown) / Gov. Recognitions / Accreditations, circular
  account icon right linking to a stubbed login route.
- Active nav link renders as a maroon pill with white text.
- GOVPH-style maroon footer, 4 columns (Republika seal + public-domain notice; About GOVPH
  + links; Government Links list; QAC contact block), centered copyright bottom bar.
- Footer is static, identical for public and portal pages.

Done when navbar and footer match the client screenshots, every value traces to
`design/figma-tokens.md`, and the layout holds at mobile/tablet/desktop.

### Phase 2 — Public view

Six pages: Home (full-bleed campus hero + wordmark overlay), About, Campuses,
Degree Programs, Gov. Recognitions, Accreditations (static/mock data first pass).

**Build protocol (agreed):** one page at a time — build it, screenshot it live via browser
automation, show the project owner, wait for confirm or adjust, then move on. Never batch
several pages and screenshot at the end.

---

## 6. Open questions

Blocking phase 2 completion:

1. Content copy for About / Campuses / Gov. Recognitions — client-provided text, or draft
   with placeholder and swap later?
2. Do Accreditations and Degree Programs need live data now, or is static/mock acceptable
   until the schema exists in phase 3+?

Blocking phases 3+:

3. Per-role permission matrix (who can read/write what, at which workflow state).
4. Accreditation state machine — the actual states, transitions, and guards.
5. Data model for programs, campuses, colleges, documents, visits, findings.
6. Account provisioning flow — how a Program Rep or Accreditor gets credentials.
7. Which events trigger email, and to whom.
8. Audit log retention and who may read it.

Unmined source: `assets/SYSTEM DESIGN FORMAT.docx` (635 KB) may answer several of the
above. Not yet read.

---

## 7. Non-functional

- **Design fidelity** — matches the client's existing Figma prototype; tokens file governs.
- **Responsive** — mobile, tablet, desktop for every page.
- **Access control** — enforced at the database via Supabase RLS, not only in middleware.
  A portal route being reachable must never be the only thing standing between a role and
  another role's data.
- **Auditability** — accreditation state transitions are recorded in Postgres.
- **Document integrity** — every uploaded PDF carries a UUID written into the file itself.

---

## 8. Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-21 | Tailwind v4 with `@theme`, not v3 + `tailwind.config.ts` | Current `create-next-app` default; class names in the plans stay valid. |
| 2026-07-21 | Use real logo assets from phase 1; drop the text-wordmark fallback | Art is present in `assets/LOGO/`; the blocker in plans 00/01 is stale. |
| 2026-07-21 | All five fonts via `next/font/google` | All available on Google Fonts; no local-font fallback needed. |
| — | pnpm; `src/` dir; App Router; route groups deferred to phase 3 | Recorded in `plans/01-shell.md`, project owner delegated the call. |
| — | Workflow state persisted in Postgres; XState owns transitions/guards only | Recorded in `CLAUDE.md`. |
