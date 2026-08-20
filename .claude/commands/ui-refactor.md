---
description: Execute the QAC-WARDS UI/UX refactor (plans/09, 09a, 09b) one phase at a time, with measurable exit gates
user_invocable: true
---

# /ui-refactor

Implement the UI/UX refactor defined by `plans/09-ui-refactor.md` (strategy + phases),
`plans/09a-ui-refactor-screens.md` (per-screen target) and `plans/09b-design-system.md`
(tokens + component APIs). Those three are the spec — read them before touching code, and
do not re-derive decisions they already record.

**Argument** = the phase to run: `0`, `1`, `2`, `3`, `4`, `4b`, `5`, `6`. No argument = run
the lowest phase whose exit gate is not yet green.

## Rules

1. **Colours, fonts and type sizes are frozen.** No new hex, no new family, no new px size.
   Anything else new goes into `design/figma-tokens.md` under "Derived — pending client
   sign-off" with its derivation.
2. **Phase order is load-bearing.** Foundations → kit → shell → screens. Never refactor a
   screen before the kit it uses. Never remove `--portal-scale`, `--auth-scale` and
   `.brand-lockup`'s zoom separately — they only agree at 1440.
3. **Component kit rule** (`CLAUDE.md`): anything on ≥2 screens is a kit component. No
   `className` styling override at a call site.
4. **Phase 1+ is blocked on owner decision U-1** (retire the pixel-diff verify loop). If it
   is unanswered, run phase 0 or 6 only and say so.
5. **Never run git.** Print the commit command as one copy-pasteable block.
6. One screen (or one component group) per commit. Stop and report if a phase's exit gate
   cannot be met — do not carry a red gate into the next phase.

## Success measures — a phase is done only when every line is true

Run these; paste the actual numbers into the report. A claim without a command output is
not a result.

| # | Measure | Command | Target |
|---|---|---|---|
| M1 | Type + lint clean | `pnpm tsc --noEmit && pnpm lint` | 0 errors |
| M2 | Build clean | `pnpm build` | success, no new warnings |
| M3 | Focus rings exist | `grep -rn "focus-visible" src \| wc -l` | > 0 and rising; **0 interactive kit components without one** |
| M4 | No arbitrary px in refactored paths | `grep -rohE '\[[0-9.]+px\]' src/components/portal src/app/portal \| wc -l` | strictly lower than the previous phase; **0** by end of phase 4 (baseline 2026-08-20: ~700) |
| M5 | Async states exist | `find src/app -name 'loading.tsx' -o -name 'error.tsx' -o -name 'not-found.tsx' \| wc -l` | ≥ 8 after phase 1 (baseline 0) |
| M6 | Responsive coverage | `grep -rlE '\b(sm\|md\|lg\|xl):' src/components/portal src/app/portal \| wc -l` over `find … -name '*.tsx' \| wc -l` | ≥ 60% of touched files (baseline 1/81) |
| M7 | Accessibility | axe (Playwright) over every route touched this phase | 0 violations at WCAG AA |
| M8 | Keyboard | tab through every touched screen; every action reachable, ring always visible, Escape closes every overlay | no dead ends |
| M9 | Viewport matrix | screenshot each touched route at 375 / 768 / 1280 / 1920 | no horizontal scroll, no clipping, no overlap |
| M10 | Dead links | every `href` in `src` resolves to a real route | 0 (BUG-6 `/portal/performance`, BUG-7 `/personnel` are the known two) |
| M11 | Contrast | check every text/background pair introduced | ≥ 4.5:1 body, ≥ 3:1 large/UI. Fix by weight/size/foreground swap, **never** by recolouring |
| M12 | No regression in behaviour | the screen's existing data flow still works (server/client split unchanged unless the spec says otherwise) | manual pass per screen |

Phase-specific additions:

- **Phase 0** — M1, M2, M3 (>0), M10 (=0), M11 on the gold-on-white fix. Nothing else.
- **Phase 1** — M5 ≥ 8; tokens present in `globals.css` and mirrored in `design/figma-tokens.md`;
  `prefers-reduced-motion` block present; no visual change to existing screens except focus +
  async states.
- **Phase 2** — every rewritten kit component satisfies 09b §13 "definition of done"; old APIs
  still compile via deprecated aliases.
- **Phase 3** — M6 and M9 on the shell at all four widths; the rail works as drawer / icon rail /
  full rail.
- **Phase 4/5** — per-screen checklist in `09a` §G, all boxes ticked, before/after screenshots at
  1280 captured for the client.
- **Phase 6** — M4 = 0, M7 across *all* routes, Lighthouse: LCP < 2.0s, CLS < 0.05, TBT < 200ms;
  the three zoom layers are gone.

## Report format

End every run with:

```
Phase <n> — <done | blocked>
M1 tsc/lint: …      M2 build: …       M3 focus-visible: N
M4 arbitrary px: N (was M)            M5 async files: N
M6 responsive: N/M files              M7 axe: N violations
M9 viewports: …                       M10 dead links: N
Screens/components touched: …
Not done and why: …
Next: phase <n+1> / owner decision <U-n>
```

Then the commit command, and the one-line append to `.claude/session-state.md`.
