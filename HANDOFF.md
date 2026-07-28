# Handoff — Phase 3a, portal UI from Figma

Written 2026-07-23, **updated 2026-07-24: Phase 3a static UI is COMPLETE.** All in-scope frames
are built. Read `.claude/session-state.md` (loaded automatically) for the two build sessions'
running notes, then `plans/03a-ui-build-runbook.md` for procedure. `design/figma-tokens.md` is the
only source of colors/fonts/sizes.

**What remains is owner-side:** re-exporting two 1x frames, confirming a handful of flagged
guesses, and swapping placeholder assets — see "Open items for the owner" below. No frames are
left to build.

---

## Scope — all built

Everything in `assets/FIGMA/` **except `register/` and `qac_admin/`** (out of scope; do not build).

| Role | Frames | Built | Left |
|---|---|---|---|
| `login` | 2 | 2 | — |
| `qac_personnel` | 12 | 12 | — |
| `program_representative` | 13 files | 13 | — |
| `internal_accreditor` | 7 | 7 | — (03.1/03.2 built from 1x exports, unverified) |

### Built 2026-07-24 (this session)

**program_representative Submissions** — `/portal/submission` (`ProgramRepSubmissions`), five query
states: `07` 1.71%, `?level=1` 2.17%, `?view=phases` 2.60%, `?view=requirements` 2.19%,
`?panel=levels` 1.89%. New kit `Panel` / `SplitStat` / `RowList` / `ProgressRow`; `Stepper` +
`Breadcrumb` + `BackLink` + `Button` gained variants rather than forks.

**internal_accreditor** — all 7: Dashboard 3.18%, Assignment 1.85%, Evaluation-list 3.77%,
Evaluation-detail 03.1/03.2 (1x, by eye), Events 4.54% (shared screen), Profile 5.33%. New kit
`PdfChip`; `SelectInput`/`DataTable` extended; `/portal/assignment` now role-switches. New token
`--color-link` (from a 1x export — unverified).

## What is done, with its measured diff

Floor is **~2.6–2.7%** (antialiasing only). 4% is fine, 9%+ is structural.

| Frame | Route | Diff |
|---|---|---|
| `login/MainLogin` | `/login` | 1.19% |
| `login/LoginForm` | `/login?as=<slug>` | 1.10% |
| `qac_personnel/01-Dashboard` | `/portal/dashboard` | 2.70% |
| `program_representative/01-Dashboard` | `/portal/dashboard` | 3.26% content |
| `pr/02-Documents` | `/portal/documents` | 5.32% |
| `pr/03-CommonsDocument(NDA)` | `?tab=common` | 2.55% |
| `pr/04-CommonDocuments(NDAFiles)` | `?tab=common&nda=1` | 6.17% |
| `pr/05-AccreditationFiles` | `?tab=reports` | 3.50% |
| `pr/06-AccreditationFiles&Folders` | `?tab=reports&folder=x` | 3.99% |
| `pr/09-Profile` | `/portal/profile` | 4.61% |
| `pr/010-Events` | `/portal/events` | 4.47% |

`npx tsc --noEmit` and `npx next lint` are both clean.

---

## What is left to build — nothing

Both remaining groups (program_representative Submissions, all internal_accreditor) were built
2026-07-24. Route map for the new screens:

| Route | Screen | Frame(s) |
|---|---|---|
| `/portal/submission[?level=|?view=phases|?view=requirements|?panel=levels]` | `ProgramRepSubmissions` | `07`/`08-Submissions*` |
| `/portal/dashboard` (IA branch) | `InternalAccreditorDashboard` | `01-Dashboard` |
| `/portal/assignment` (IA branch) | `InternalAccreditorAssignment` | `02-Accreditation` |
| `/portal/evaluation` | `InternalAccreditorEvaluation` | `03-DocumentEvaluation` |
| `/portal/evaluation/[id]?state=review\|done` | `InternalAccreditorEvaluationDetail` | `03.1`/`03.2` **(1x, unverified)** |
| `/portal/events`, `/portal/profile` (IA data) | shared screens | `04-Events`, `05-Profile` |

The one thing a next session must still *do* in code: when the owner re-exports `03.1`/`03.2` at
2x, diff `InternalAccreditorEvaluationDetail` against them and confirm `--color-link` (`#3996FF`),
the chip sizing, and the section spacing — all currently transcribed by eye.

---

## How to work (tooling is already built)

Scripts live in the scratchpad — **copy them somewhere durable if the session's scratchpad is
gone**, they are small:

```
<scratchpad>/shoot.js    node shoot.js <route> <frameRelPath> [roleKey]
                         renders at the frame's own size, prints whole + content diff,
                         writes <tag>-heat.png (red = differs) and <tag>-view.png
<scratchpad>/measure.js  node measure.js <frameRelPath>
                         prints content bands and card rectangles in design px
```

A dev server is usually already on :3000. Playwright is the npx-cached copy at
`~/.npm/_npx/361ceb562f3b3235/node_modules/playwright` — require it by absolute path. `sharp` is in
`node_modules`. **There is no numpy and no pip on this machine.**

### Non-obvious measurement rules — read before touching a frame

- **Trust ink width over cap height.** Descenders inflate the cap box. Every card title on the PR
  dashboard measured ~20px by cap height and is actually **15px**; ink width caught it. This has
  now been right every single time.
- **Frame PNGs are RGBA, Playwright's are RGB.** A diff that assumes 3 channels for both reports
  ~36% nonsense and looks exactly like a real regression. Always take channels from
  `resolveWithObject`. This cost real time already.
- **Never render a portal screen wider than 1440** — the shell zooms above that.
- **Scrolling frames** (taller than 810, e.g. PR `01-Dashboard` at 1079): rendering at full height
  stretches the sidebar, because the frame's rail is viewport-height while its content scrolls.
  "Log Out" then appears twice in the heat map. Diff the **content area (x ≥ 250)** and check the
  rail separately at 810.
- Hide the dev switcher when screenshotting: `[data-dev-switcher]{display:none !important}`.
- **Content padding differs per screen family and per tab** — dashboard 61/53, Documents Templates
  73, Documents Reports 54, Profile 81, qac_personnel dashboard 57. Always measure; never assume.

---

## Architecture you must not undo

**The identity seam.** `src/lib/current-user.ts` → `getCurrentUser()` reads cookie `qac_dev_user`,
looks it up in `PORTAL_USERS` (`portal/data.ts`), falls back to `DEFAULT_PORTAL_USER`. It is
server-only by construction (`next/headers` throws in a client component). **When the backend
lands, only that one function body changes** to `supabase.auth.getUser()` +
`user.app_metadata.role` — never `user_metadata`, users can edit their own.

**Routing: shared URL, role-branched content.** Different roles' sidebars link to the *same* paths,
so `page.tsx` is a thin switch on `getCurrentUser().role` and screens live in
`src/components/portal/screens/`. Follow this for every new shared route. Already done for
`/portal/dashboard` and `/portal/documents`; `/portal/profile` and `/portal/events` are single
screens with role-varying data instead, because their frames are identical across roles.

**Dev switcher** (`portal/dev/switch/route.ts` + `DevUserSwitcher.tsx`) is a preview affordance,
never auth. 404s in production, dead code in a production build, absolutely positioned so it
contributes zero layout. It is the one thing deliberately exempt from `figma-tokens.md` so it
cannot read as product UI.

**Kit rule (CLAUDE.md):** anything on 2+ screens is a component in `portal/kit/`. Pages pass data
and variants, never a `className` override at the call site. Extend with a prop rather than forking
— `DataTable` gained `variant="outlined"` rather than a near-duplicate.

**Never run git.** Print the command as one copy-pasteable block. Pushing needs
`GIT_SSH_COMMAND='ssh -i ~/.ssh/id_ed25519_work -o IdentitiesOnly=yes'`. `graphify-out/` is already
tracked — exclude it from `git add`.

---

## Decisions taken this session (do not relitigate)

- **`--text-banner: 31px` is now a real token.** Three frames carry a "Welcome to…" heading between
  the 20 and 36 tokens (31 / 31 / 30.3). Adopting one token improved all three: login 1.52→1.19,
  qac_personnel dashboard 2.82→2.70, PR dashboard 3.58→3.26. **This moved the project's quoted
  "antialiasing floor" from 2.82% to ~2.70%** — older numbers in the plans predate it.
- Login footnote normalised on `MainLogin` (the `AuthShell` variant prop is gone); LoginForm's
  Login pill stays centred though the frame puts it 3px left.
- New tokens: `--color-approved: #21A235`, `--color-pdf: #EA4335`.
- `PORTAL_USERS` has **no `qac_admin`** — out of scope, inventing one would be a guess.
- Every role's frame uses the **same placeholder name and position**; roles differ only by avatar.
  Owner confirmed keeping the frames' copy rather than distinct demo names.
- `kit/Field.tsx` corrected to the frame (40px shell, 12px text, transparent fill) and
  `SectionHeading` to 15px — both were measurably wrong and Profile is their only consumer.

## Open items for the owner

- **`internal_accreditor/03.1` + `03.2` are 1x exports.** Need re-exporting at 2x, then the
  evaluation-detail screen (`/portal/evaluation/[id]`) can be diffed. Its layout, chip sizing and
  the new **`--color-link` `#3996FF`** token are all transcribed by eye and unconfirmed.
- **`08-Submissions(Levels).png` looks like a stale duplicate** of `08-Submissions(LevelsAcred`
  (drops the Readiness card, retitles the panel "Levels", card 5px wider). Built at
  `/portal/submission?panel=levels` and left for you to confirm or discard.
- **Submissions bars vs labels disagree in the frames:** Level I's bar is drawn ~28% and Phase 1's
  ~100% while both read "23%". The bars are derived from the percentage instead. And
  `08-Submissions(LevelsAcred` draws the levels box's bottom border *above* Levels III/IV (a
  fixed-height Figma frame overflowing); our box grows to contain the expanded stepper.
- **`public/assets/colleges/cadbe.png` is an SVG with a `.png` extension** → Next's optimizer
  returns HTTP 400 → the CADBE seal renders **broken** on `/portal/documents/main-campus`.
  `cpspa.png` is a WebP with a `.png` name (works, but the name lies). **Not fixed.**
- PR dashboard content padding is **61/53** vs qac_personnel's 57/57 at an identical 1076 width;
  the IA dashboard is **61/52** with a **30px** stat-tile gutter (vs 14 elsewhere). Reproduced.
- Assets lifted from frames and still needing real files: college seals, avatars, `login-hero.jpg`,
  folder icons, `nda-signature.png`, empty-folder art, PDF thumb.
- Naming drift in `program_representative/`: `010-Events.png` sorts first, three `07-Submissions*`,
  and `08-Submissions(LevelsAcred.png` is missing its closing bracket.

## Commit

Nothing committed across the two build sessions. When ready (excludes the skill-cache and
machine-local files that are tracked but should not be in this commit):

```bash
git add -A ':!graphify-out' ':!.claude/settings.json' ':!CLAUDE.md' ':!.claude/CLAUDE.md' ':!.claude/skills' ':!.gitattributes' && git commit -m "build program representative submissions and all internal accreditor screens" && git push
```
