# Prototype-matching notes

How the phase-2 public pages were matched to the client's Figma prototype captures, and the
per-page facts that are not obvious from reading the code. Companion to `figma-tokens.md`.

## Token rule

`figma-tokens.md` has only 36/20/15/12px + 5 colors; the prototypes use more. **Snap to the
nearest token when one exists, use an arbitrary value only when none can serve, and flag it.**

Outstanding arbitrary values, all flagged to the client: accreditation level labels (~24px→20),
campus card titles (~24px→20; prototype ink width 292px for "PUP STA. ROSA CAMPUS" vs 248px at
20px), "PROGRAM ACCREDITATION STATUS" (~34px→36), stat numerals `text-[120px]`, "OFFICIALS AND
STAFF" (~41px→36), About cream band `#FFF8DC` + rules `#E1C16E`.

## Method for matching a prototype screenshot

1. The client sends overlapping viewport captures. **Stitch them first.** Brute-force row-match
   each pair over the FULL range `5..H` — a real offset can exceed a truncated search window and
   you will silently lock onto a bogus match in a blank region. Reject `err 0` matches whose
   comparison band is uniform; use a band containing text. Crop the browser's ~4px black left
   edge so composite x == page x.
2. Recover font sizes from **cap heights, not ink runs**: `font-size ≈ capHeight / 0.727` for
   Inter. Ink runs vary with which glyphs a line happens to contain; the cap height of one
   flat-topped letter (`T`, `F`, `H`, `M`) is stable.
3. Convert measured cap-top positions to CSS margins with
   `capTop = boxTop + (lineHeight − 1.21·fontSize)/2 + 0.242·fontSize`. This predicted every
   About margin to within ~10px on the first try.
4. **Do not infer that content is absent from a gap between captures.** On About, a plausible
   bottom padding closed the gap after the chiefs — two whole staff rows were hiding in there.
   When consecutive captures do not overlap in a *content-bearing* band, say so and ask for the
   missing screenshot.
5. **The image cache only holds images from the most recent user message**
   (`~/.claude/image-cache/<session-id>/`, renumbered `1.png`, `2.png`… each time). Measure every
   batch the moment it lands — a capture from two messages ago is gone from disk, and eyeballing
   coordinates off the rendered view is good to about ±10px, not enough for margin work.
6. **Express crops as ratios of viewport width, never absolute px** — the client's browser is
   ~1849px wide, test viewports are 1440. `aspect-[w/h]` + `object-cover` + a percentage
   `object-position` is scale-invariant; verify at both widths.

## Portal frame scale

The portal is measured in literal px off a **1440x810** frame, so on any wider window it holds
its absolute size and shrinks *proportionally* — at 1920 the 250px sidebar is 13% of the width
where the frame says 17.4%. The shell therefore carries `portal-scale`
(`src/app/globals.css`, applied in `src/app/portal/layout.tsx`), which zooms it by
`clamp(1, tan(atan2(100vw, 1440px)) * 0.9, 2)`.

- `tan(atan2(a, b))` is the CSS idiom for a length ratio as a `<number>`. The `@property`
  registration is load-bearing: it computes the value on `:root`, where zoom is still 1, instead
  of re-evaluating inside the zoomed subtree and feeding back on itself.
- **`zoom` does not rescale viewport units.** A plain `h-screen` on the zoomed element lays out
  `scale` times too tall (360px of document overflow at 1920), which also steals scrolling from
  `main`. The utility owns `height: calc(100dvh / var(--portal-scale))` for exactly that reason —
  do not put `h-screen` back beside it.
- Floor 1 so a sub-1440 window is never shrunk below the design; cap 2 = 2880px, the export's own
  resolution. At 1440 and below the scale is 1, so the verify loop below is unaffected — the
  dashboard diff is 2.82% before and after.
- **The `* 0.9` is a deliberate deviation, not part of the frame math.** A strict frame-width
  scale read a touch large to the owner (2026-07-23), so it is damped 10%: 1.2 rather than 1.333
  at 1920, 1.6 rather than 1.778 at 2560. It is the tuning knob — raise toward 1 for a stricter
  match, lower for a roomier UI. Side effect: nothing scales until ~1600 wide, since below that
  the damped ratio is under the floor of 1.
- Measured against `01-Dashboard.png` at the *undamped* scale, i.e. what the frame math is worth
  on its own: 1920 went 16.27% → 3.42%, 2560 lands at 3.07% (1440 baseline 2.82%). Sidebar holds
  the frame's 17.4% of viewport width at every width from 1440 up; damping trades that to 15.6%.

## Gotchas

- **Next `<Image>`: `width`/`height` must be the file's TRUE pixel size.** Wrong values bake
  artifacts into the cached WebP or serve upscaled files. After changing a file in `public/`,
  `rm -rf .next/dev/cache/images`.
- **Tailwind v4 gives `text-title` a 1.5 line-height (54px); the prototypes use ~1.2.** Every
  heading needs explicit `leading-[1.2]` or the page drifts ~11px per heading. Biggest single
  source of vertical error on About.
- Padding is *inside* `max-w-*` — size the wrapper accordingly.
- **JSX silently eats spaces** around `</strong>`. Guard with a DOM assertion comparing
  `textContent` to the expected string. Putting copy in string arrays sidesteps this entirely —
  done on About and Campuses.
- Ink overflow from `whitespace-nowrap` does NOT show up in a `getBoundingClientRect().right`
  scan; only `scrollWidth > clientWidth` catches it.
- Lazy images below the fold are **blank in a Playwright fullPage screenshot** unless you scroll
  first, then `waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0))`.
- The Next dev-indicator badge (bottom-left, ~x19) corrupts pixel scans — exclude `x < 100`.
- Line breaks drift ~1 word from the prototype in places; that is font-metric drift between
  renderers, not container width. Accepted.

## Per-page facts

### About — `src/app/about/page.tsx`

Container `max-w-[1152px]` (wider than the 1140 used earlier). Hero
`aspect-[1445/532] object-cover object-[center_2%]` — the supplied `ABOUT US.jpg` is a different,
3:2 full-body photo, so it is cropped to the prototype's band ratio (hero/vw = 0.3682, ~9%
headroom). The Director's message is the only **justified** text on the site and uses a real
`sm:float-left` photo (para 3 wraps under it). History paragraphs use 35px line-height,
everything else `leading-loose`.

Employee PNGs ship with a **5px frame baked into the file** (`#FCF5E5` on cream, `#FFFFFF` on
white) — do not add a CSS border; only `shadow-[6px_6px_11px_rgba(0,0,0,0.25)]` is ours.
Portraits render `h-[310px] w-auto`. `claudio-framed.png` is Claudio with the white frame
recoloured for the cream band. Officials band is 5 rows: 1 / 2 / 4 (`gap-x-[106px]`) / 3 / 3
(`gap-x-[130px]`), `mt-[45px]` between rows.

The prototype randomly renders PALMA's and DISTOR's name+role ~1.3x larger than everyone else's —
normalised on purpose. The prototype also duplicates the "To date, PUP has 84 accredited
programs…" paragraph in History; shipped once.

### Accreditations — `src/app/accreditations/page.tsx`

Hero `aspect-[3.66] object-[center_38%]` — **settled, do not shrink further** (a tighter crop was
tried and rejected). Stat cards 168×168, 61px gap, `opacity-20` bg; the numeral gold keyline is
four 1px offset `text-shadow`s.

### Gov. Recognitions — `src/app/gov-recognitions/page.tsx`

Hero at natural aspect (`h-auto w-full`), no crop. Grid `max-w-[1270px]`,
`gap-x-[35px] gap-y-[86px]`. Content is **placeholder**, matching the prototype; the
`RECOGNITIONS` array is the swap point. The hero is soft **in the source asset** — measured, not
a rendering bug. Needs a client re-export ≥1850px; do not waste time on `quality=` /
`unoptimized`, worth 0.5%.

### Campuses — `src/app/about/campuses/page.tsx`

Route is `/about/campuses` (what the Navbar already links to), not `/campuses`.

Card grid is **flex-wrap + `justify-center`, not `grid`** — 22 cards, `w-[365px]`,
`gap-x-[33px] gap-y-[66px]`, `max-w-[1161px]`. That is what centres the lone 22nd card (UNISAN)
in the last row, which `grid-cols-3` would left-align. Card = photo
`aspect-[365/206] object-cover`, then `mt-6` title, then `mt-6` body
(`text-subheading leading-loose` = 15/30). Section closes with `pb-30` (120px to the footer).
Every one of those was verified against the client capture to ≤1px.

Copy lives in the `CAMPUSES` array; `RichText` parses `**bold**` (body colour) and `__bold__`
(maroon — used for "Republic Act No. 9472" and the intro's place names).

Stat band rhythm: `mt-9` numeral→label, `mt-16` label→intro paragraph, `pb-28` paragraph→rule.
The rule under the intro is `h-[5px]` at full `BAND` width. Verified to ≤2px at every band
**before** the client asked to scale the band up.

**The client asked for the band bigger than the prototype (2026-07-22), so it is deliberately
off-prototype now.** Numerals `text-[150px]` (measured 120), labels `text-title` 36px +
`leading-[1.2]` (measured ~24; 36 is the next token up, so bigger *and* token-compliant), side
rules `h-3.5` 14px (measured 9.8). Hero cropped from its natural 3.626 to
`aspect-[4.5] object-[center_16%]` — 16% is derived, not guessed: the seal+wordmark occupy rows
81–244 of the 374px asset, and that offset centres them exactly in the crop window. Re-derive it
if the aspect changes again.

**The 365px side rules could not survive that scale-up.** At 36px labels the two stat blocks need
364px + gaps but the middle only had 431px, leaving 5px either side. Rules are now `flex-1` with
`gap-x-[60px]` all round (≈309px each at 1435). The old "rule = exactly one grid column"
relationship is gone; do not restore `w-[365px]` without shrinking the type back.

Stat type needs the `md:` step (`text-[96px] md:text-[150px]`, `text-heading md:text-title`) — at
full size the two blocks alone are 424px and overflow a 390px viewport. Same reason the rules
must never be `shrink-0`.

The prototype's stat pair sits ~15–20px right of where centring puts it, and its container edges
move 3–7px between the two captures. That drift is the ~4px black browser edge being an
unreliable origin — do not chase it.

### Navbar — `src/components/Navbar.tsx`

Client rejected the `hover:bg-maroon/10` pill on top-level links — hover must **darken the font
only**, no container background. Rest states are muted (`text-maroon/50`, icons at `/60`), hover
goes to full strength. The active link keeps its solid `bg-maroon text-white` pill; that is the
current-page indicator, not hover.

**About dropdown**, measured off the client's hover screenshot and matched to within 1px: card
`w-[254px] rounded-[20px] p-[10px]`; items `h-[38px] rounded pl-5 pr-2`, no gaps between rows;
rest `text-maroon` at `text-subheading`; hover = `bg-gray/15` + `font-bold` + `ChevronRight
h-5 w-5` fading in (`group-hover:opacity-100`, so no layout shift). **`bg-gray/15` over white
computes to exactly `#EBEBEB`**, the measured fill — token-derived, so no arbitrary hex was
needed. The prototype shows **no active/current-page styling** on dropdown items (its screenshot
is taken on an `/about` route and the "About" item is unstyled), so that distinction was
deliberately removed rather than overlooked.

## Still open with the client

- **Missing employee assets.** `assets/EMPLOYEES/` has no PALMA, ENTIENZA, DISTOR or TRANCE — all
  four were lifted 1:1 from the client's own screenshots and re-framed (`5.png` boxes
  `(927,13,1150,313)` / `(782,461,1005,761)`; `15.png` boxes `(603,49,826,349)` /
  `(970,49,1193,349)`). Swap when real exports arrive.
- **Campuses stat-band rules are `#990000`** in the prototype while the full-width rule below the
  intro is `#800000` (the maroon token) — two reds on one band, almost certainly a prototype
  slip. Both shipped as `bg-maroon`.
- **ALFONSO and CABIAO both cite "Republic Act No. 11754"** — likely one is wrong.
- The prototype is inconsistent about emphasising statutes: 7 RAs are black bold, STO. TOMAS's
  RA 9472 is maroon bold, MULANAY's RA 7645 is not bold at all. Reproduced faithfully rather than
  normalised. LOPEZ ended "Yumul, Sr.." with a doubled period; shipped with one.
- **Brand lockup reconciled 2026-07-26** (`src/components/BrandLockup.tsx`, used by both bars). The
  client reported the white bar's wordmark as smaller than the maroon one. Measured on their own
  screenshots: **both wordmarks were already identical** — 20px Poppins bold, 292px ink, cap 16. The
  drift was around it: the public bar set the university line at 15px against the portal's 10, and
  the seal at 56px against 45, so the wordmark stopped dominating its block. Both now render
  identical blocks (PUP cap 7 / w 221, wordmark cap 16 / w 292), matching
  `qac_personnel/01-Dashboard.png` (291.5 at 1x). Wordmark is also all-caps now, as the prototype has
  it. Public bar height stays pinned at 80px — auth reserves exactly that (`auth-scale`).
- **The size difference the client kept reporting was a zoom-layer mismatch, fixed 2026-07-26.** The
  portal top bar sits inside the shell and is magnified by `--portal-scale` above 1440; the public
  navbar is not. So the *same* lockup drew 337px in the portal and 292px in the public bar on their
  1854px window, while matching exactly at 1440 — which is why the verify loop never caught it. The
  public lockup now takes `min(var(--portal-scale), 1.6)` via `.brand-lockup` (globals.css); measured
  delta 0.0 at 1280/1440/1854/1920/2560. **Anything measured only at 1440 proves nothing about wide
  windows — three zoom layers are all 1 there.**
- An earlier maroon reference the client sent was neither our app nor our frames (367px wide at a 16px
  cap, ~26% wider tracking, bar 64px+ vs our 59). Their later pair was our app. Ask before chasing it.
- The seal artwork's white oval and highlights vanish against a white bar — visible box 56x45 on
  maroon vs 53x42 on white from the same 45px image. Matching it needs a seal asset with a dark edge.
- Prototype navbar is ~58px tall vs our 80px. Still **not** reconciled: auth reserves 80px
  (`auth-scale`, globals.css) and changing it moves every page.
- Gov. Certification hero re-export ≥1850px (see above).
