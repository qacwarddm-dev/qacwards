# QAC Wards — Roadmap

Single repo, single domain, Next.js App Router with `(public)` / `(portal)` route groups. See `../CLAUDE.md` for stack and `../design/figma-tokens.md` for colors/fonts.

## Phases

| # | Phase | File | Depends on | Status |
|---|---|---|---|---|
| 1 | Shell (scaffold, navbar, footer) | [01-shell.md](01-shell.md) | — | Built, awaiting sign-off |
| 2 | Public view (marketing pages) | [02-public-view.md](02-public-view.md) | 1 | Next |
| 3 | Auth + role gate | [03-auth-role-gate.md](03-auth-role-gate.md) | 1 | Not started |
| 4 | Program Rep portal | [04-program-rep-portal.md](04-program-rep-portal.md) | 3 | Not started |
| 5 | Internal Accreditor portal | [05-accreditor-portal.md](05-accreditor-portal.md) | 4 | Not started |
| 6 | QAC Personnel/Admin portal | [06-personnel-admin-portal.md](06-personnel-admin-portal.md) | 5 | Not started |
| 7 | Calendar / visit scheduling | [07-calendar.md](07-calendar.md) | 6 | Not started |
| 8 | Audit log + polish + deploy | [08-audit-deploy.md](08-audit-deploy.md) | 7 | Not started |

## Known blockers

- ~~Real logo/icon assets not delivered~~ — resolved. `assets/LOGO/` has PUP, QAC, Republika ng Pilipinas, AACCUP, CHED. Copied to `public/assets/logos/`; no text-wordmark fallback was needed. `assets/ICONS/` is still empty, covered by lucide-react.
- Phase 2 page copy comes from project-owner screenshots, supplied per page during the build loop.
- Phases 3–8 have empty spec files. Out of scope for now — current run is phases 1 + 2 only.

## Roles (5)

Public, QAC Personnel, QAC Admin, Internal Accreditor, Program Representative.
