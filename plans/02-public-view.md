# Phase 2 — Public View

**Status: done** — all six pages built, screenshot-matched to the client prototype and confirmed by the project owner.

> **Expect revisions.** This phase is done in the sense that every page is built and signed off against the prototype we were given. It is not frozen. Several points are still open with the client (see *Open with the client* in `.claude/session-state.md`), and any of them can send a page back for rework:
>
> - **Token gaps.** The prototype uses sizes and colors that `design/figma-tokens.md` does not define (a ~24px heading step, `#990000`, the About cream band). Where a token could serve we snapped to it and flagged the difference; if the client wants exact prototype values instead, the token file changes and the affected pages change with it.
> - **Deliberate departures.** The Campuses stat band was scaled up past the prototype at the project owner's request, so it no longer matches those captures by design.
> - **Placeholder and unverified content.** Gov. Recognitions ships the prototype's literal placeholders. Campus copy has two client-side content issues flagged (a duplicated Republic Act number, inconsistent statute emphasis).
> - **Missing/low-quality assets.** Four employee portraits were reconstructed from client screenshots pending real exports; the Gov. Certification hero needs a re-export at ≥1850px.
> - **Prototype reconciliation.** The prototype navbar is ~58px tall against our 80px with an all-caps wordmark — not reconciled, and touching it affects every page.

## Goal

Build all public-facing pages (no auth), matching the client's Figma prototype, using the shell from phase 1.

## Depends on

Phase 1 (shell — navbar/footer must exist).

## Pages in scope

1. **Home** — hero section: full-bleed campus aerial image/video background, centered wordmark overlay ("Polytechnic University of the Philippines / Quality Assurance Center") + seal
2. **About** (dropdown parent in navbar, 3 sub-pages):
   - **About** — About Us / mission-vision content
   - **Campuses** — list/grid of PUP campuses
   - **Degree Programs** — list of degree programs (may later link into accreditation status per program — check with client whether this pulls from Postgres once that data exists, or stays static for phase 2)
3. **Gov. Recognitions** — static content, government recognition info
4. **Accreditations** — accreditation status display (uses "PROGRAM ACCREDITATION STATUS" heading, Roboto Serif per tokens). Likely needs live program/status data eventually — for phase 2 build static/mock version, revisit as dynamic once phase 6 (QAC portal) defines the data model.

## Open questions for client

- ~~Do "Accreditations" and "Degree Programs" need real data now, or is static/mock content fine until the DB schema exists (phase 3+)?~~ — resolved: static/mock for phase 2. Accreditations counts live in an `ACCREDITATION_LEVELS` array as the swap point.
- ~~Content copy for About/Campuses/Gov. Recognitions — need actual text, not placeholder?~~ — resolved: real copy supplied per page as screenshots and transcribed. Exception: Gov. Recognitions, where the prototype itself ships literal placeholders ("Date", "TITLE OF CERTIFICATION"); the `RECOGNITIONS` array is the swap point.

## Tasks

- [x] Confirm content copy source for each page (client-provided text vs placeholder)

Per-page build loop (execution mode only — not done during planning). For each of the 6 pages below: build it, take a live screenshot via browser automation, show it to the project owner, wait for confirm/adjust before moving to the next page. Do not batch-build multiple pages then screenshot at the end — one page, one screenshot, one confirm, repeat.

- [x] Home — build → screenshot → confirm match to Figma
- [x] About — build → screenshot → confirm match to Figma
- [x] Campuses — build → screenshot → confirm match to Figma (`/about/campuses`; stat band since scaled up past the prototype on request)
- [x] Degree Programs — build → screenshot → confirm match to Figma
- [x] Gov. Recognitions — build → screenshot → confirm match to Figma
- [x] Accreditations (static/mock data first pass) — build → screenshot → confirm match to Figma
- [x] Responsive check per page (mobile/tablet breakpoints), re-screenshot if layout shifts

## Acceptance criteria

- [x] Every page reachable from navbar renders and matches Figma layout/spacing
- [x] All 5 nav destinations (Home, About + 2 sub-pages, Gov. Recognitions, Accreditations) live
- [~] No hardcoded colors/fonts outside `design/figma-tokens.md` — **partially met.** Fonts and colors hold, with two exceptions carried deliberately: the About cream band (`#FFF8DC`/`#E1C16E`) and arbitrary type sizes the token scale cannot express (stat numerals, `leading-[1.2]` corrections). Each is isolated in a named constant with a comment. The token file needs the client's missing values before this can close cleanly.

## Notes carried into later phases

- Routes are **flat** (`src/app/about/...`). The `(public)`/`(portal)` route groups described in `CLAUDE.md` and phase 1 are not set up — do that as one migration when auth lands in phase 3, not piecemeal.
