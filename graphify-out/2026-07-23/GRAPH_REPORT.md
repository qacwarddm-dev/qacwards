# Graph Report - qacwards  (2026-07-23)

## Corpus Check
- 129 files · ~3,159,225 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 620 nodes · 874 edges · 54 communities (40 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b8e2e3b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Portal Screens and Fake Data
- Portal Routing and Auth Architecture
- Design Tokens and Site Shell
- Prototype-Matching Method and Traps
- Login and Auth Component Kit
- Package Manifest and Dependencies
- Public Marketing Pages
- TypeScript Compiler Config
- About Page and Staff Roster
- Portal Shell and Identity Seam
- Calendar and Visit Scheduling
- Document Browser Screen
- COPC Dashboard Chart
- ESLint Config
- PostCSS Config
- Empty Sample Plan
- lucide-react Icon Set
- Repo README
- data.ts
- broadcast.md
- What You Must Do When Invoked
- Session Log
- Claude Code Handoff
- kit/index.ts
- DocumentBrowser.tsx
- /handoff
- QAC Wards Accreditation System
- claude-code-handoff/hooks/proactive-handoff.sh
- Component Kit Rule
- .claude/hooks/proactive-handoff.sh
- graphify reference: extra exports and benchmark
- Figma frame exports
- Phase Roadmap
- Can One Person Hold Two Roles?
- Accreditation Lifecycle
- Shared URL vs Role-Prefixed URL Rule
- Decision: a Literal /portal Segment
- graphify reference: query, path, explain
- Visit Scheduling
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- CLAUDE.md
- live-handoff.sh
- post-edit-hook.sh
- pre-compact.sh
- pre-compact-handoff.sh
- session-start.sh
- extraction-spec.md
- events/page.tsx
- MiniCalendar.tsx
- Role Claim Belongs in app_metadata

## God Nodes (most connected - your core abstractions)
1. `Phase 3a UI Build Runbook` - 23 edges
2. `Prototype-Matching Notes` - 21 edges
3. `Phase 3b - Auth + Role Gate` - 18 edges
4. `compilerOptions` - 16 edges
5. `Phase 3a - Portal UI (static, no backend)` - 13 edges
6. `What You Must Do When Invoked` - 12 edges
7. `Phase 2 - Public View` - 12 edges
8. `Phase Roadmap` - 11 edges
9. `/graphify` - 10 edges
10. `QAC Wards Accreditation System` - 10 edges

## Surprising Connections (you probably didn't know these)
- `react-big-calendar` --semantically_similar_to--> `MonthCalendar()`  [INFERRED] [semantically similar]
  PRD.md → src/components/portal/kit/MonthCalendar.tsx
- `RLS Is the Authorization Boundary` --semantically_similar_to--> `Access Control Enforced at the Database`  [EXTRACTED] [semantically similar]
  plans/03-auth-role-gate.md → PRD.md
- `Figma Design Tokens (source of truth)` --references--> `RootLayout()`  [INFERRED]
  design/figma-tokens.md → src/app/layout.tsx
- `Dev-Only Role Switcher` --conceptually_related_to--> `ROLES`  [INFERRED]
  plans/03a-portal-ui-static.md → src/app/login/RolePicker.tsx
- `zoom Does Not Rescale Viewport Units` --references--> `PortalLayout()`  [EXTRACTED]
  design/prototype-notes.md → src/app/portal/layout.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The Five-Role Access Model** — prd_qac_wards, prd_role_public, prd_role_program_representative, prd_role_internal_accreditor, prd_role_qac_personnel, prd_role_qac_admin [EXTRACTED 1.00]
- **Portal URL and Authorization Architecture** — plans_03_auth_role_gate_literal_portal_segment, plans_03_auth_role_gate_middleware_matcher, plans_03_auth_role_gate_rls_boundary, plans_03_auth_role_gate_next_open_redirect_guard, plans_03_auth_role_gate_role_dispatcher, plans_03_auth_role_gate_app_metadata_role_claim [EXTRACTED 1.00]
- **The Prototype-Matching Method** — design_prototype_notes_cap_height_recovery, design_prototype_notes_cap_top_margin_formula, design_prototype_notes_screenshot_stitching, design_prototype_notes_token_snap_rule, plans_03a_ui_build_runbook_2x_frame_rule, plans_03a_ui_build_runbook_playwright_verify, plans_03a_ui_build_runbook_pixel_diff_floor [EXTRACTED 1.00]

## Communities (54 total, 14 thin omitted)

### Community 0 - "Portal Screens and Fake Data"
Cohesion: 0.16
Nodes (11): CampusFolderPage(), CollegeFolderPage(), CollegePage(), CAMPUSES, COLLEGES, DOCUMENT_FOLDERS, SAMPLE_FILES, DocumentBrowser() (+3 more)

### Community 1 - "Portal Routing and Auth Architecture"
Cohesion: 0.23
Nodes (12): Literal /portal Segment, Not a Route Group, UI-First Phase Reorder (2026-07-23), Phase 2 Shipped Flat Routes, Decision: a Literal /portal Segment, Fail-Closed Middleware Matcher, next= Open-Redirect Guard, Phase 3b - Auth + Role Gate, (portal) Route Group URL Collision (+4 more)

### Community 2 - "Design Tokens and Site Shell"
Cohesion: 0.06
Nodes (44): Design System Rule - tokens only, The 31px Heading Snap, Gray #7B7979 (muted), Maroon #800000 (brand), Core Color Tokens, Yellow #EFBF04 (accent), Login Copyright Below the Token Floor, Derived Tokens - pending client sign-off (+36 more)

### Community 3 - "Prototype-Matching Method and Traps"
Cohesion: 0.10
Nodes (31): Commit Message Rules, Never Run Git, Do Not Infer Absent Content From a Gap, Cap-Height Font-Size Recovery, Cap-Top to CSS Margin Formula, Next Dev Indicator Corrupts Pixel Scans, Image Cache Holds Only the Latest Message, Ink Overflow Needs scrollWidth, Not getBoundingClientRect (+23 more)

### Community 4 - "Login and Auth Component Kit"
Cohesion: 0.13
Nodes (11): LoginForm(), HEADING, AuthButton(), Size, Tone, AuthCard(), AuthPasswordField(), AuthTextField() (+3 more)

### Community 5 - "Package Manifest and Dependencies"
Cohesion: 0.06
Nodes (34): eslint, eslint-config-next, lucide-react, next, dependencies, lucide-react, next, react (+26 more)

### Community 6 - "Public Marketing Pages"
Cohesion: 0.06
Nodes (22): Accreditations Page Match Facts, Campuses Page Match Facts, Campuses Stat Band Scaled Up on Request, Gov. Recognitions Page Match Facts, Prototype Content Slips Reproduced Faithfully, Phases 1-2 Are Done But Not Frozen, Per-Page Build Loop Protocol, Phase 2 - Public View (+14 more)

### Community 7 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "About Page and Staff Roster"
Cohesion: 0.11
Nodes (15): About Page Match Facts, Missing Employee Portrait Assets, ADMINISTRATIVE_STAFF, ASSISTANT_DIRECTORS, CHIEFS, COORDINATORS, CORE_FUNCTIONS, DIRECTOR (+7 more)

### Community 9 - "Portal Shell and Identity Seam"
Cohesion: 0.13
Nodes (16): Dev-Only Role Switcher, An Empty Sidebar Is by Design, Say So, The Identity Seam, /portal/performance and /portal/feedback 404, The Sidebar Must Receive the User, ROLES, DashboardPage(), ProfilePage() (+8 more)

### Community 10 - "Calendar and Visit Scheduling"
Cohesion: 0.24
Nodes (9): Phase 7 - Calendar / Visit Scheduling (empty stub), react-big-calendar, Visit Scheduling, CalendarMonth, DayMark, MARK_COLOR, MonthCalendar(), monthLabel() (+1 more)

### Community 11 - "Document Browser Screen"
Cohesion: 0.33
Nodes (3): Content Padding Differs Per Screen Family, ENTRIES, CoverCard()

### Community 12 - "COPC Dashboard Chart"
Cohesion: 0.50
Nodes (4): CopcChart(), SERIES, smoothPath(), X_LABELS

### Community 18 - "data.ts"
Cohesion: 0.20
Nodes (6): COLUMNS, ASSIGNMENT_STEPS, ASSIGNMENTS, PanelHeader(), Step, Stepper()

### Community 19 - "broadcast.md"
Cohesion: 0.08
Nodes (24): 2026-07-21T05:25:08Z [9399f597-541], 2026-07-21T05:25:19Z [9399f597-541], 2026-07-21T05:33:23Z [9399f597-541], 2026-07-21T05:33:35Z [9399f597-541], 2026-07-21T05:33:47Z [9399f597-541], 2026-07-21T05:34:00Z [9399f597-541], 2026-07-21T05:34:12Z [9399f597-541], 2026-07-21T05:34:31Z [9399f597-541] (+16 more)

### Community 20 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 21 - "Session Log"
Cohesion: 0.09
Nodes (22): Index, Session Log, セッション: 2026-07-21T06:39:11Z, セッション: 2026-07-21T07:23:41Z, セッション: 2026-07-21T08:57:59Z, セッション: 2026-07-21T12:21:47Z, セッション: 2026-07-21T12:29:43Z, 変更ファイル (+14 more)

### Community 22 - "Claude Code Handoff"
Cohesion: 0.11
Nodes (17): 1. Automated Live Handoff (recommended), 2. Manual `/handoff` Command, Claude Code Handoff, During a session, Ending a session, Files, Install, License (+9 more)

### Community 23 - "kit/index.ts"
Cohesion: 0.23
Nodes (7): FieldLabel(), PasswordInput(), SelectInput(), TextInput(), FolderEntry, SectionHeading(), BrowserView

### Community 24 - "DocumentBrowser.tsx"
Cohesion: 0.25
Nodes (5): BackLink(), Crumb, Button(), Variant, SearchField()

### Community 25 - "/handoff"
Cohesion: 0.15
Nodes (12): Cleanup Rules (apply to all handoff types except Clean), Guiding principle: write for the NEXT context window, /handoff, Instructions, Option: Bug, Option: Clean, Option: Context (Normal), Option: Task (+4 more)

### Community 26 - "QAC Wards Accreditation System"
Cohesion: 0.20
Nodes (11): Phase 6 - QAC Personnel/Admin Portal (empty stub), Next.js (App Router) + React, No Public Self-Registration, QAC Wards Accreditation System, Planned Repo Layout, Role: Public, Role: QAC Admin, Role: QAC Personnel (+3 more)

### Community 27 - "claude-code-handoff/hooks/proactive-handoff.sh"
Cohesion: 0.44
Nodes (7): cleanup_state(), init_state(), load_state(), save_state(), proactive-handoff.sh script, track_file(), update_timestamp()

### Community 28 - "Component Kit Rule"
Cohesion: 0.25
Nodes (8): Component Kit Rule, Kit Components Are Presentational, Keep Formatting in Components, Not Fake Data, Kit Discipline, Portal Bold Is font-semibold, Stat, StatCard(), StatRow()

### Community 29 - ".claude/hooks/proactive-handoff.sh"
Cohesion: 0.18
Nodes (12): DASHBOARD_STATS, PR_CALENDAR_MARKS, PR_CALENDAR_MONTH, PR_DASHBOARD_STATS, PR_DOC_STATUS, PR_ONGOING_ACCREDITATION, PR_RECENT_UPLOADS, PROFILE (+4 more)

### Community 30 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 31 - "Figma frame exports"
Cohesion: 0.29
Nodes (6): Also worth exporting, Figma frame exports, Frame width — settled, How to export, How to name, Naming — the existing folder does not follow the rule

### Community 32 - "Phase Roadmap"
Cohesion: 0.25
Nodes (8): Phase Roadmap, Role Slug Is program_representative, Phase 4 - Program Rep Portal (empty stub), Phase 5 - Internal Accreditor Portal (empty stub), Phase 8 - Audit Log + Polish + Deploy (empty stub), Role: Internal Accreditor, Role: Program Representative, PortalRole

### Community 33 - "Can One Person Hold Two Roles?"
Cohesion: 0.29
Nodes (6): Can One Person Hold Two Roles?, /portal Is the Role Dispatcher, Schema-Shaped Questions to Ask as You Go, Open Questions Blocking Phases 3+, SYSTEM DESIGN FORMAT.docx (unmined source), PortalIndex()

### Community 34 - "Accreditation Lifecycle"
Cohesion: 0.40
Nodes (6): Do Not Encode Workflow State in the Path, Accreditation Lifecycle, Audit Log of State Transitions, PostgreSQL, Workflow State Persisted in Postgres, XState

### Community 35 - "Shared URL vs Role-Prefixed URL Rule"
Cohesion: 0.33
Nodes (7): Per-Role Views Are a Rendering Split, Not a Routing Split, Shared URL vs Role-Prefixed URL Rule, Document UUID Stamping, SMTP via nodemailer, pdf-lib, pdf-parse, Supabase Storage

### Community 36 - "Decision: a Literal /portal Segment"
Cohesion: 0.19
Nodes (9): FILL, LABEL, StatusBar, DocStatus, FILL, LABEL, StatusPill(), Upload (+1 more)

### Community 37 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 38 - "Visit Scheduling"
Cohesion: 0.22
Nodes (5): COLUMNS, REPORT_STATS, REPORTS, Column, Row

### Community 39 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 40 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 41 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 51 - "events/page.tsx"
Cohesion: 0.29
Nodes (4): EVENT_MARKS, EVENT_MONTH, Card(), CalendarLegend()

### Community 52 - "MiniCalendar.tsx"
Cohesion: 0.29
Nodes (6): DOT, DOT_LABEL, MeetingKind, MiniCalendar(), MiniCalendarProps, WEEKDAYS

### Community 53 - "Role Claim Belongs in app_metadata"
Cohesion: 0.40
Nodes (5): Role Claim Belongs in app_metadata, Backend Explicitly Out of Scope for 3a, How Does a Registrant Prove Role Entitlement?, Access Control Enforced at the Database, Supabase Auth

## Knowledge Gaps
- **235 isolated node(s):** `live-handoff.sh script`, `post-edit-hook.sh script`, `pre-compact-handoff.sh script`, `pre-compact.sh script`, `session-start.sh script` (+230 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 3a UI Build Runbook` connect `Prototype-Matching Method and Traps` to `Can One Person Hold Two Roles?`, `Design Tokens and Site Shell`, `Public Marketing Pages`, `Portal Shell and Identity Seam`, `Document Browser Screen`, `Component Kit Rule`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `Phase 3a - Portal UI (static, no backend)` connect `Prototype-Matching Method and Traps` to `Phase Roadmap`, `Portal Routing and Auth Architecture`, `Design Tokens and Site Shell`, `Portal Shell and Identity Seam`, `Role Claim Belongs in app_metadata`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `Prototype-Matching Notes` connect `Prototype-Matching Method and Traps` to `About Page and Staff Roster`, `Design Tokens and Site Shell`, `Public Marketing Pages`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `live-handoff.sh script`, `post-edit-hook.sh script`, `pre-compact-handoff.sh script` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design Tokens and Site Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.05551020408163265 - nodes in this community are weakly interconnected._
- **Should `Prototype-Matching Method and Traps` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._
- **Should `Login and Auth Component Kit` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._