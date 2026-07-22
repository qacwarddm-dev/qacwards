# QAC Wards

Accreditation workflow system, 5 roles: Public, QAC Personnel, QAC Admin, Internal Accreditor, Program Representative.

## Design system — always follow

All colors, fonts, and type sizes MUST come from `design/figma-tokens.md`. Never invent hex values, font families, or px sizes outside that file — it mirrors the client's existing Figma prototype. When building any UI component, read that file first.

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

Single repo, single domain. Route groups split public vs internal:
- `(public)` — marketing/about, no auth
- `(portal)` — role-gated via middleware + Supabase Auth session/role claim

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
