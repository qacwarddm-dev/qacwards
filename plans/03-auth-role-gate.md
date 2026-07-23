# Phase 3 (3b) — Auth + Role Gate

> **⚠️ Not the current phase. Do not start here.**
>
> As of 2026-07-23 all portal UI is built static from the owner's Figma **before** any auth or
> database wiring. That work is [`03a-portal-ui-static.md`](03a-portal-ui-static.md) — go there.
>
> The "*Open: how routes divide among the four levels*" section below, and the open questions at
> the foot of this file, describe a **per-role page inventory blocker that no longer exists.** The
> owner had the full Figma the whole time. Treat those sections as historical; the Figma answers
> them.
>
> Everything else here — the literal `/portal` segment, the fail-closed middleware matcher, RLS as
> the real authorization boundary, the `next=` open-redirect guard, the `(public)` migration — is
> still current and still applies when this phase begins.

## Goal

Stand up Supabase Auth, put every non-public page behind a session check, and establish the URL
architecture the four internal access levels will build on in phases 4–6.

## Depends on

Phase 1 (shell). Phase 2 is done but its routes move during this phase — see *Migration*.

## Access levels

| Level | Role | Portal phase |
|---|---|---|
| 0 | Public (no auth) | 2 — done |
| 1 | Program Representative | 4 |
| 2 | Internal Accreditor | 5 |
| 3 | QAC Personnel | 6 |
| 4 | QAC Admin | 6 |

---

## URL architecture

### The `(portal)` route group in `CLAUDE.md` does not work as written

Verified against this repo on 2026-07-22, not assumed. Parenthesised segments are Next.js
**route groups**: they scope layouts but contribute nothing to the URL. A probe file at
`src/app/(portal)/accreditations/page.tsx` alongside the existing public page fails the dev
server with HTTP 500:

> You cannot have two parallel pages that resolve to the same path.
> Please check /(portal)/accreditations and /accreditations.

`/accreditations` is a name both sides want, and so are `/calendar` and `/campuses`. The route
group cannot namespace them. **`CLAUDE.md`'s structure section needs correcting as part of this
phase.**

### Decided: a literal `/portal` segment

```
src/app/(public)/layout.tsx        Navbar + Footer
src/app/(public)/page.tsx          /
src/app/(public)/about/…           /about, /about/campuses, /about/degree-programs
src/app/(public)/accreditations/   /accreditations
src/app/(public)/gov-recognitions/ /gov-recognitions
src/app/login/page.tsx             /login          ← public, in neither group
src/app/portal/layout.tsx          portal shell, role-aware nav
src/app/portal/…                   /portal/…
```

`(public)` stays a route group because it only needs a shared *layout*. `portal` is a literal
segment because it needs a shared *namespace*.

The payoff is the middleware matcher:

```ts
export const config = { matcher: ["/portal/:path*"] };
```

One rule, fail-closed — any route added under `/portal` is protected the moment the file exists.
The alternative (bare paths, every protected route enumerated in the matcher) fails open: the day
someone adds `/reports` and forgets the matcher entry, that page is public. Never accept that
trade to save a path segment.

### Open: how routes divide among the four levels

**This is the one piece not yet decided, and it needs the per-role page inventory to close.**
No spec for the internal system exists in the repo — `plans/03`–`08` and `plans/sample.md` are
empty, and `SYSTEM DESIGN FORMAT.docx` carries only colors, fonts and the type scale. Until that
inventory exists, any concrete route table below the `/portal` prefix is a guess.

**Rule for deciding it page by page:**

> If two roles can open the same database row, it gets **one** URL and the role decides what
> renders. If a feature exists for exactly one role, it gets a **role-prefixed** URL.

**Recommended shape under that rule**, to be confirmed against the real inventory:

```
/portal                        dashboard — dispatches on role claim
/portal/programs               list; RLS scopes what each role sees
/portal/programs/[id]
/portal/accreditations/[id]    the workflow record — rep, accreditor and QAC all land here
/portal/documents/[id]
/portal/calendar               phase 7
/portal/admin/users            QAC Admin only
/portal/admin/audit            QAC Admin only — phase 8
/portal/admin/settings         QAC Admin only
```

Two stack-specific reasons to resist role-prefixed URLs for shared records:

- **Email (nodemailer).** An accreditation workflow is notification-driven. If a record's URL
  depends on the reader's role, every notification must resolve the recipient's role to build its
  link, forwarded links break, and a user holding two roles has two URLs for one record.
- **Document UUIDs (pdf-lib).** UUIDs stamped into PDFs need a stable resolution target. A
  role-dependent path makes that a lookup instead of a constant.

Also note "different pages per role" most often means different *views and actions over shared
objects*. That is a rendering split (compose per-role view components under one route), not a
routing split. Only split the route when the underlying data is genuinely disjoint.

### Do not encode workflow state in the path

`/portal/accreditations/[id]/pending-review` rots the moment the record transitions. Keep
`/portal/accreditations/[id]` and render from the state persisted in Postgres, with XState
computing transitions only.

---

## The URL is not the security boundary

Middleware redirects unauthenticated visitors. That is all it does. It cannot answer whether
*this* representative may read program 999.

- **Postgres RLS is the authorization boundary.** Every portal table gets policies keyed on the
  authenticated user and role claim.
- A user requesting a record they do not own must get zero rows from RLS and a 404 — never a
  middleware pass over a populated page.
- Server Components and Route Handlers must query through the user's session client, not the
  service-role key. A single service-role query in a request path is a full RLS bypass.

## Login flow

- `/login` stays public and outside both groups.
- Deep links survive auth via `?next=`, defaulting to `/portal`.
- **Validate `next` before redirecting:** it must be a relative path beginning with `/portal`.
  Otherwise it is an open redirect.
- `/portal` itself is the role dispatcher — no separate `/portal/dashboard`.

## Migration (do as one change, not piecemeal)

Phase 2 shipped flat routes (`src/app/about/…`) because the groups were not needed yet. This
phase moves them:

1. Create `src/app/(public)/` and move `page.tsx`, `about/`, `accreditations/`,
   `gov-recognitions/` into it.
2. Move the Navbar + Footer chrome from the root layout into `(public)/layout.tsx`, leaving the
   root layout holding only `<html>`, fonts and `globals.css`.
3. Leave `login/` at `src/app/login/`.
4. Confirm every public URL is byte-identical afterwards — the group must not change one path.
5. Correct the structure section in `CLAUDE.md`.

## Tasks

- [ ] Confirm the per-role page inventory with the project owner (blocks the route table)
- [ ] Supabase project + Auth configured; role claim on the session — put it in `app_metadata`,
      never `user_metadata`, which users can edit themselves
- [ ] `src/middleware.ts` with `matcher: ["/portal/:path*"]`, session refresh, redirect to
      `/login?next=…`
- [ ] `(public)` migration per above, public URLs verified unchanged
- [ ] `src/app/portal/layout.tsx` — portal shell with role-aware navigation
- [ ] `/portal` role dispatcher
- [ ] RLS policies on every portal table, with a test per role proving cross-role reads return
      zero rows
- [ ] Open-redirect guard on `next`, with a test
- [ ] `CLAUDE.md` structure section corrected

## Acceptance criteria

- No unauthenticated request reaches any `/portal/*` route
- Every public URL from phase 2 resolves unchanged after the migration
- A signed-in user of each role can reach exactly their permitted pages, verified per role
- Cross-role data access returns 404 via RLS, not via UI hiding
- No service-role key used in any request-path query

## Open questions for the project owner

- **Per-role page inventory** — the list of pages each of the four levels gets. Everything below
  `/portal` waits on this.
- Can one person hold two roles (e.g. QAC Personnel who also represents a program)? If yes, the
  role dispatcher needs a role switcher and role-prefixed URLs become actively harmful.
- Are Program Representatives scoped to one program or several?
- Do accreditors see only assigned accreditations, or all of them read-only?
