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

## System-breaking pitfalls — check before every migration and query change

**Embeds go ambiguous silently.** Adding any table with FKs to two tables (junction, history, link table) makes every unhinted supabase-js embed between those two tables fail with PGRST201. Most selects here ignore `error`, so the page just sees no rows. This took the rep Accreditation page to "Not started 0%" while the accreditor side looked fine (`submission_cycle_history`, commit 0fd523b, fixed in 06e0f1c).
- Before applying a migration that adds such a table, grep `src` for embeds between the two tables and add `!fk_name` hints (`accreditation_cycles!submissions_cycle_id_fkey(...)`).
- Already hinted for the same reason: `accreditation_levels!level_id` on `program_accreditations` (two FKs into levels).
- CI (`.github/workflows/ci.yml`, job `schema`) starts a throwaway local Supabase, applies every migration, then `scripts/check-embeds.mjs` asks PostgREST whether every `.from("t").select("…")` in `src` is valid. It fails the build on ambiguous embeds, missing tables and missing columns. Run `pnpm check:embeds --list` to see what it extracts; it only ever probes a local instance.
- Selects built with `${}` are skipped by that check, so keep selects as plain string literals.

**Migrations must replay on an empty database.** Reference rows (phases, phase documents, levels) are loaded by `supabase/seed.sql`, which runs after migrations, so a migration must never assume they exist. Use `insert … select … from <ref table>` (a no-op when empty), not a scalar `(select id …)` into a NOT NULL column. CI's `schema` job replays every migration from scratch and caught `20260919000100_moa_phase_document.sql` failing this way.

**A failed lookup must not read as "ok".** `submissionWindow` in `src/lib/cycle.ts` treats a null result as allowed, so a broken query silently turned the cycle end-date lock off. When adding guards, fail closed on `error` or null data.

**Portal is a literal `/portal` segment, never a `(portal)` group** (see Structure).

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

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
