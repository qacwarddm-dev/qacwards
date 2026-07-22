# Phase 2 — Public View

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

- Do "Accreditations" and "Degree Programs" need real data now, or is static/mock content fine until the DB schema exists (phase 3+)?
- Content copy for About/Campuses/Gov. Recognitions — need actual text, not placeholder, before final build (or draft with lorem and swap later?)

## Tasks

- [ ] Confirm content copy source for each page (client-provided text vs placeholder)

Per-page build loop (execution mode only — not done during planning). For each of the 6 pages below: build it, take a live screenshot via browser automation, show it to the project owner, wait for confirm/adjust before moving to the next page. Do not batch-build multiple pages then screenshot at the end — one page, one screenshot, one confirm, repeat.

- [ ] Home — build → screenshot → confirm match to Figma
- [ ] About — build → screenshot → confirm match to Figma
- [ ] Campuses — build → screenshot → confirm match to Figma
- [ ] Degree Programs — build → screenshot → confirm match to Figma
- [ ] Gov. Recognitions — build → screenshot → confirm match to Figma
- [ ] Accreditations (static/mock data first pass) — build → screenshot → confirm match to Figma
- [ ] Responsive check per page (mobile/tablet breakpoints), re-screenshot if layout shifts

## Acceptance criteria

- Every page reachable from navbar renders and matches Figma layout/spacing
- All 5 nav destinations (Home, About + 2 sub-pages, Gov. Recognitions, Accreditations) live
- No hardcoded colors/fonts outside `design/figma-tokens.md`
