# Graph Report - qacwards  (2026-08-01)

## Corpus Check
- 164 files · ~3,932,130 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 760 nodes · 1122 edges · 60 communities (49 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `38374628`
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
- ProgressRow.tsx
- graphify reference: extra exports and benchmark
- Figma frame exports
- Phase Roadmap
- Can One Person Hold Two Roles?
- Accreditation Lifecycle
- InternalAccreditorEvaluationDetail.tsx
- Decision: a Literal /portal Segment
- graphify reference: query, path, explain
- ProgramRepDashboard.tsx
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- events/page.tsx
- MiniCalendar.tsx
- QAC Wards Accreditation System
- Phase Roadmap
- [campus]/[folder]/page.tsx
- Phase 2 - Public View
- dashboard/page.tsx
- MiniCalendar.tsx
- Card
- InternalAccreditorEvaluation.tsx
- accreditations/page.tsx
- gov-recognitions/page.tsx
- Exports Are 2x of 1440x810 - Halve Everything
- submission/page.tsx
- The Figma Export Is the Only Blocker Left in 3a
- CopcChart.tsx

## God Nodes (most connected - your core abstractions)
1. `Phase 3a UI Build Runbook` - 23 edges
2. `Prototype-Matching Notes` - 21 edges
3. `Phase 3b - Auth + Role Gate` - 18 edges
4. `compilerOptions` - 16 edges
5. `getCurrentUser()` - 14 edges
6. `Phase 3a - Portal UI (static, no backend)` - 13 edges
7. `What You Must Do When Invoked` - 12 edges
8. `Phase 2 - Public View` - 12 edges
9. `Phase Roadmap` - 11 edges
10. `Button()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `react-big-calendar` --semantically_similar_to--> `MonthCalendar()`  [INFERRED] [semantically similar]
  PRD.md → src/components/portal/kit/MonthCalendar.tsx
- `Figma Design Tokens (source of truth)` --references--> `RootLayout()`  [INFERRED]
  design/figma-tokens.md → src/app/layout.tsx
- `Dev-Only Role Switcher` --conceptually_related_to--> `ROLES`  [INFERRED]
  plans/03a-portal-ui-static.md → src/app/login/RolePicker.tsx
- `zoom Does Not Rescale Viewport Units` --references--> `PortalLayout()`  [EXTRACTED]
  design/prototype-notes.md → src/app/portal/layout.tsx
- `The Identity Seam` --references--> `PortalLayout()`  [EXTRACTED]
  plans/03a-ui-build-runbook.md → src/app/portal/layout.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The Five-Role Access Model** — prd_qac_wards, prd_role_public, prd_role_program_representative, prd_role_internal_accreditor, prd_role_qac_personnel, prd_role_qac_admin [EXTRACTED 1.00]
- **Portal URL and Authorization Architecture** — plans_03_auth_role_gate_literal_portal_segment, plans_03_auth_role_gate_middleware_matcher, plans_03_auth_role_gate_rls_boundary, plans_03_auth_role_gate_next_open_redirect_guard, plans_03_auth_role_gate_role_dispatcher, plans_03_auth_role_gate_app_metadata_role_claim [EXTRACTED 1.00]
- **The Prototype-Matching Method** — design_prototype_notes_cap_height_recovery, design_prototype_notes_cap_top_margin_formula, design_prototype_notes_screenshot_stitching, design_prototype_notes_token_snap_rule, plans_03a_ui_build_runbook_2x_frame_rule, plans_03a_ui_build_runbook_playwright_verify, plans_03a_ui_build_runbook_pixel_diff_floor [EXTRACTED 1.00]

## Communities (60 total, 11 thin omitted)

### Community 0 - "Portal Screens and Fake Data"
Cohesion: 0.15
Nodes (10): CampusFolderPage(), CollegeFolderPage(), CAMPUSES, COLLEGES, DOCUMENT_FOLDERS, SAMPLE_FILES, DocumentBrowser(), EmptyState() (+2 more)

### Community 1 - "Portal Routing and Auth Architecture"
Cohesion: 0.08
Nodes (24): 2026-07-21T05:25:08Z [9399f597-541], 2026-07-21T05:25:19Z [9399f597-541], 2026-07-21T05:33:23Z [9399f597-541], 2026-07-21T05:33:35Z [9399f597-541], 2026-07-21T05:33:47Z [9399f597-541], 2026-07-21T05:34:00Z [9399f597-541], 2026-07-21T05:34:12Z [9399f597-541], 2026-07-21T05:34:31Z [9399f597-541] (+16 more)

### Community 2 - "Design Tokens and Site Shell"
Cohesion: 0.06
Nodes (44): Design System Rule - tokens only, The 31px Heading Snap, Gray #7B7979 (muted), Maroon #800000 (brand), Core Color Tokens, Yellow #EFBF04 (accent), Login Copyright Below the Token Floor, Derived Tokens - pending client sign-off (+36 more)

### Community 3 - "Prototype-Matching Method and Traps"
Cohesion: 0.23
Nodes (13): Commit Message Rules, Never Run Git, Do Not Infer Absent Content From a Gap, Image Cache Holds Only the Latest Message, Ink Overflow Needs scrollWidth, Not getBoundingClientRect, JSX Silently Eats Spaces Around </strong>, Lazy Images Are Blank in a fullPage Screenshot, Prototype-Matching Notes (+5 more)

### Community 4 - "Login and Auth Component Kit"
Cohesion: 0.07
Nodes (23): normalize(), resolveDemoRole(), ROLE_BY_KEYWORD, LoginForm(), HEADING, CreatePasswordForm(), RULES, CAMPUSES (+15 more)

### Community 5 - "Package Manifest and Dependencies"
Cohesion: 0.05
Nodes (40): eslint, eslint-config-next, dependencies, lucide-react, next, react, react-dom, devDependencies (+32 more)

### Community 6 - "Public Marketing Pages"
Cohesion: 0.15
Nodes (9): Phases 1-2 Are Done But Not Frozen, Per-Page Build Loop Protocol, Phase 2 - Public View, Phase 2 Done But Not Frozen, No-Hardcoded-Values Criterion Only Partially Met, Per-Screen Build Loop, metadata, ICON_LINKS (+1 more)

### Community 7 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 8 - "About Page and Staff Roster"
Cohesion: 0.11
Nodes (15): About Page Match Facts, Missing Employee Portrait Assets, ADMINISTRATIVE_STAFF, ASSISTANT_DIRECTORS, CHIEFS, COORDINATORS, CORE_FUNCTIONS, DIRECTOR (+7 more)

### Community 9 - "Portal Shell and Identity Seam"
Cohesion: 0.08
Nodes (24): Dev-Only Role Switcher, An Empty Sidebar Is by Design, Say So, The Identity Seam, /portal/performance and /portal/feedback 404, The Sidebar Must Receive the User, ROLES, NewAssignmentPage(), AssignmentPage() (+16 more)

### Community 10 - "Calendar and Visit Scheduling"
Cohesion: 0.22
Nodes (10): Phase 7 - Calendar / Visit Scheduling (empty stub), react-big-calendar, Visit Scheduling, CalendarMonth, DayMark, MARK_COLOR, MonthCalendar(), monthLabel() (+2 more)

### Community 11 - "Document Browser Screen"
Cohesion: 0.13
Nodes (11): PR_ACCREDITATION_FOLDERS, PR_COMMON_DOCUMENTS, PR_TEMPLATE_SECTIONS, DocCard(), DocTab, DocTabs(), FILL, slots() (+3 more)

### Community 12 - "COPC Dashboard Chart"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 18 - "data.ts"
Cohesion: 0.22
Nodes (10): Band, decode(), Decoded, diffPct(), ROOT, SHOTS, AUTH_BAND, AUTH_VIEWPORT (+2 more)

### Community 19 - "broadcast.md"
Cohesion: 0.09
Nodes (22): Index, Session Log, セッション: 2026-07-21T06:39:11Z, セッション: 2026-07-21T07:23:41Z, セッション: 2026-07-21T08:57:59Z, セッション: 2026-07-21T12:21:47Z, セッション: 2026-07-21T12:29:43Z, 変更ファイル (+14 more)

### Community 20 - "What You Must Do When Invoked"
Cohesion: 0.19
Nodes (11): Fake Data Typed Into the Files, data.ts Is the Single Backend Swap Point, PortalNotification, PortalProfile, PR_CALENDAR_MARKS, PR_CALENDAR_MONTH, PR_DASHBOARD_STATS, PR_DOC_STATUS (+3 more)

### Community 21 - "Session Log"
Cohesion: 0.17
Nodes (11): Architecture you must not undo, Built 2026-07-24 (this session), Commit, Decisions taken this session (do not relitigate), Handoff — Phase 3a, portal UI from Figma, How to work (tooling is already built), Non-obvious measurement rules — read before touching a frame, Open items for the owner (+3 more)

### Community 22 - "Claude Code Handoff"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 23 - "kit/index.ts"
Cohesion: 0.40
Nodes (4): Size, SIZES, Variant, VARIANTS

### Community 24 - "DocumentBrowser.tsx"
Cohesion: 0.29
Nodes (6): Also worth exporting, Figma frame exports, Frame width — settled, How to export, How to name, Naming — the existing folder does not follow the rule

### Community 25 - "/handoff"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 26 - "QAC Wards Accreditation System"
Cohesion: 0.40
Nodes (4): Debug Issue, Steps, Tips, Token Efficiency Rules

### Community 27 - "claude-code-handoff/hooks/proactive-handoff.sh"
Cohesion: 0.40
Nodes (4): Explore Codebase, Steps, Tips, Token Efficiency Rules

### Community 28 - "Component Kit Rule"
Cohesion: 0.17
Nodes (7): COLUMNS, ASSIGNMENT_STEPS, ASSIGNMENTS, REPORT_STATS, REPORTS, PanelHeader(), COLUMNS

### Community 29 - "ProgressRow.tsx"
Cohesion: 0.05
Nodes (56): Literal /portal Segment, Not a Route Group, Phase Roadmap, UI-First Phase Reorder (2026-07-23), Phase 2 Shipped Flat Routes, Role Claim Belongs in app_metadata, Can One Person Hold Two Roles?, Decision: a Literal /portal Segment, Fail-Closed Middleware Matcher (+48 more)

### Community 30 - "graphify reference: extra exports and benchmark"
Cohesion: 0.40
Nodes (4): Refactor Safely, Safety Checks, Steps, Token Efficiency Rules

### Community 31 - "Figma frame exports"
Cohesion: 0.40
Nodes (4): Output Format, Review Changes, Steps, Token Efficiency Rules

### Community 32 - "Phase Roadmap"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 33 - "Can One Person Hold Two Roles?"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 35 - "InternalAccreditorEvaluationDetail.tsx"
Cohesion: 0.12
Nodes (9): IA_COMPLIANCE_AREAS, IA_EVALUATION_STEPS, IA_EVALUATIONS, IA_NARRATIVE_DOCS, PdfChip(), COLUMNS, InternalAccreditorEvaluation(), InternalAccreditorEvaluationDetail() (+1 more)

### Community 36 - "Decision: a Literal /portal Segment"
Cohesion: 0.19
Nodes (11): centre(), FILL, LABEL, StatusBar, StatusBarChart(), DocStatus, FILL, LABEL (+3 more)

### Community 37 - "graphify reference: query, path, explain"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 38 - "ProgramRepDashboard.tsx"
Cohesion: 0.25
Nodes (7): Content Padding Differs Per Screen Family, DashboardPage(), DASHBOARD_STATS, StatRow(), InternalAccreditorDashboard(), ProgramRepDashboard(), QacPersonnelDashboard()

### Community 51 - "events/page.tsx"
Cohesion: 0.33
Nodes (4): EVENT_MARKS, EVENT_MONTH, EVENT_TITLES, CalendarLegend()

### Community 52 - "MiniCalendar.tsx"
Cohesion: 0.12
Nodes (16): ProfilePage(), AuthButton(), Size, Tone, ELIGIBLE_ACCREDITORS, NEW_ASSIGNMENT_FIELDS, PROFILES, Button() (+8 more)

### Community 53 - "QAC Wards Accreditation System"
Cohesion: 0.11
Nodes (8): Column, Row, FolderEntry, RowList(), SplitStat(), SplitStatHalf, Step, VARIANTS

### Community 54 - "Phase Roadmap"
Cohesion: 0.29
Nodes (7): Component Kit Rule, Kit Components Are Presentational, Keep Formatting in Components, Not Fake Data, Kit Discipline, Portal Bold Is font-semibold, Stat, StatCard()

### Community 56 - "[campus]/[folder]/page.tsx"
Cohesion: 0.24
Nodes (4): Crumb, VARIANTS, SearchField(), BrowserView

### Community 57 - "Phase 2 - Public View"
Cohesion: 0.20
Nodes (7): Campuses Page Match Facts, Campuses Stat Band Scaled Up on Request, Prototype Content Slips Reproduced Faithfully, Campus, CAMPUSES, metadata, STATS

### Community 60 - "dashboard/page.tsx"
Cohesion: 0.25
Nodes (8): Next Dev Indicator Corrupts Pixel Scans, portal-scale Zoom Utility, The *0.9 Damping Is Deliberate, zoom Does Not Rescale Viewport Units, nextConfig, The 2.8% Antialiasing Pixel-Diff Floor, Playwright Verify Setup, PortalLayout()

### Community 63 - "MiniCalendar.tsx"
Cohesion: 0.29
Nodes (6): DOT, DOT_LABEL, MeetingKind, MiniCalendar(), MiniCalendarProps, WEEKDAYS

### Community 67 - "InternalAccreditorEvaluation.tsx"
Cohesion: 0.50
Nodes (4): CopcChart(), SERIES, smoothPath(), X_LABELS

### Community 68 - "accreditations/page.tsx"
Cohesion: 0.40
Nodes (3): Accreditations Page Match Facts, ACCREDITATION_LEVELS, metadata

### Community 69 - "gov-recognitions/page.tsx"
Cohesion: 0.40
Nodes (3): Gov. Recognitions Page Match Facts, metadata, RECOGNITIONS

### Community 70 - "Exports Are 2x of 1440x810 - Halve Everything"
Cohesion: 0.50
Nodes (4): Cap-Height Font-Size Recovery, Cap-Top to CSS Margin Formula, Figma Frames Are 1440x810 at 2x, Exports Are 2x of 1440x810 - Halve Everything

### Community 71 - "submission/page.tsx"
Cohesion: 0.18
Nodes (8): SubmissionPage(), VIEWS, PR_ACCREDITATION_LEVELS, PR_LEVEL_STEPS, PR_PHASES, PR_READINESS, PR_REQUIREMENTS, SubmissionView

### Community 72 - "The Figma Export Is the Only Blocker Left in 3a"
Cohesion: 0.67
Nodes (3): The Figma Export Is the Only Blocker Left in 3a, assets/FIGMA/ Is the Only Source of Truth, Per-Role Frame/Build Checklist

### Community 73 - "CopcChart.tsx"
Cohesion: 0.20
Nodes (8): IA_ASSIGNED_EVALUATIONS, IA_DASHBOARD_STATS, IA_EVALUATION_PROGRESS, IA_UPCOMING_SCHEDULE, CardTitleBar(), EVALUATION_COLUMNS, PROGRESS_COLUMNS, SCHEDULE_COLUMNS

## Knowledge Gaps
- **257 isolated node(s):** `uvx`, `eslintConfig`, `nextConfig`, `name`, `version` (+252 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Phase 3a UI Build Runbook` connect `Prototype-Matching Method and Traps` to `Design Tokens and Site Shell`, `ProgramRepDashboard.tsx`, `Exports Are 2x of 1440x810 - Halve Everything`, `Public Marketing Pages`, `Portal Shell and Identity Seam`, `The Figma Export Is the Only Blocker Left in 3a`, `What You Must Do When Invoked`, `Phase Roadmap`, `dashboard/page.tsx`, `ProgressRow.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `Phase 3a - Portal UI (static, no backend)` connect `ProgressRow.tsx` to `Design Tokens and Site Shell`, `Prototype-Matching Method and Traps`, `The Figma Export Is the Only Blocker Left in 3a`, `Portal Shell and Identity Seam`, `What You Must Do When Invoked`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `Kit Discipline` connect `Phase Roadmap` to `Prototype-Matching Method and Traps`, `QAC Wards Accreditation System`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `uvx`, `eslintConfig`, `nextConfig` to the rest of the system?**
  _257 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portal Screens and Fake Data` be split into smaller, more focused modules?**
  _Cohesion score 0.1471861471861472 - nodes in this community are weakly interconnected._
- **Should `Portal Routing and Auth Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Design Tokens and Site Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.05551020408163265 - nodes in this community are weakly interconnected._