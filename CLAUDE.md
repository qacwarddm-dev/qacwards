# QAC Wards

Accreditation workflow system, 5 roles: Public, QAC Personnel, QAC Admin, Internal Accreditor, Program Representative.

## Design system — always follow

All colors, fonts, and type sizes MUST come from `design/figma-tokens.md`. Never invent hex values, font families, or px sizes outside that file — it mirrors the client's existing Figma prototype. When building any UI component, read that file first.

## Component kit — always follow

**If a piece of UI appears on more than one screen, it is a component. Put it in the kit; never copy-paste it into a second page.**

- Portal kit lives in `src/components/portal/kit/`, one file per component, re-exported from `kit/index.ts`.
- Before building a screen, read `kit/index.ts` and reuse what is there. Extend an existing component with a prop rather than forking a near-duplicate.
- The moment a second screen needs something a page already has inline, **move it into the kit** and update the first screen to import it. Do not leave two copies.
- A kit component owns its own look — spacing, radius, colors, type. Pages pass data and variants, not styling. If a page needs a one-off tweak, that is a prop on the component, not a `className` override at the call site.
- Kit components are presentational and take fake data via props, so the swap to real data is a page-level change.

## Tech stack

- Frontend/Backend: Next.js (App Router) + React, API Routes
- Database: PostgreSQL (application data + audit logs)
- File storage: Supabase Storage
- Auth: Supabase Auth (multi-role, RLS-backed)
- Workflow: XState (transition/guard logic; persist actual state in Postgres)
- Document processing: pdf-parse (read/validate) + pdf-lib (write UUID into doc)
- Email: SMTP (nodemailer)
- Calendar: react-big-calendar
- Deploy: Vercel

## Structure

Single repo, single domain. Public and internal are split by route:
- `(public)` — marketing/about, no auth. A route group: it only needs a shared layout.
- `/portal` — a **literal path segment, not a route group**. Role-gated via middleware + Supabase
  Auth session/role claim. A `(portal)` group was tried and fails: groups contribute nothing to
  the URL, so `(portal)/accreditations` collides with the public `/accreditations` and the dev
  server 500s. The literal segment also buys a fail-closed matcher `["/portal/:path*"]`.

## Git — never run it

NEVER run `git add`, `git commit`, or `git push`. I run those myself.

When work is ready to commit, print the full command as one copy-pasteable block, e.g.:

```bash
git add -A && git commit -m "add navbar and footer shell" && git push
```

Commit message rules:
- Simple, plain, one line. No conventional-commit prefixes required.
- No `Co-Authored-By` line. No `Generated with Claude Code` line. No trailers of any kind.
- No multi-line body unless I ask for one.
