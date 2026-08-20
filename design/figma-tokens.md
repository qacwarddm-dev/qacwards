# Figma Design Tokens — QAC Wards

Source of truth for all colors, fonts, and type scale. Follows the existing Figma prototype. Any UI work must pull values from here, not invent new ones.

## Colors

| Token | Hex | Name |
|---|---|---|
| `--color-white` | `#FFFFFF` | White |
| `--color-black` | `#000000` | Black |
| `--color-maroon` | `#800000` | Maroon (primary/brand) |
| `--color-yellow` | `#EFBF04` | Yellow (accent) |
| `--color-gray` | `#7B7979` | Gray (neutral/muted) |

## Fonts

| Token | Family | Usage |
|---|---|---|
| `--font-main` | Inter | Body/default |
| `--font-pup` | Playfair Display SC | "PUP" header |
| `--font-qac` | Poppins | "QAC" header |
| `--font-footer` | Inria Serif | Footer |
| `--font-status` | Roboto Serif | "PROGRAM ACCREDITATION STATUS" |

## Type Scale

| Token | Size (px) | Usage |
|---|---|---|
| `--text-title` | 36 | Title |
| `--text-heading` | 20 | Heading |
| `--text-subheading` | 15 | Subheading |
| `--text-regular` | 12 | Regular |

## Derived — pending client sign-off

Not in the client's Figma token list. Measured off the portal frame exports
(`assets/FIGMA/qac_personnel/01-Dashboard.png`) because the five colors and four sizes above
cannot dress a portal. Everything here is a real measured value from the prototype, not an
invention — but it has not been confirmed by the client. Sanctioned by `plans/03a-portal-ui-static.md`.

| Token | Value | Measured on |
|---|---|---|
| `--color-surface` | `#F5F5F5` | Portal content-area background |
| `--color-positive` | `#06AA8D` | Up-trend arrow on the dashboard stat cards |
| `--color-alert` | `#F90509` | Notification-count badge on the top bar bell |
| `--color-holiday` | `#2363EE` | "Holiday" dot in the Events calendar legend |
| `--color-approved` | `#21A235` | "Approved" pill + bar, `program_representative/01-Dashboard` |
| `--color-link` | `#3996FF` | Blue filename links in the document-evaluation chips, `internal_accreditor/03.1` **(1x export — unverified)** |
| `--color-highlight` | `#EBEBEB` | Unread/hover row fill in the notifications panel, `qac_personnel/interactables/overall-notifications-button` |
| `--text-small` | 10px | "Polytechnic University of the Philippines" in the portal top bar |
| `--text-micro` | 9px | Chart axis labels (300 / 0 / I–IV) |
| `--text-banner` | 31px | "Welcome to…" banner/hero heading — see the note below |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.1)` | Banner / stat card / chart card elevation |
| `--shadow-sidebar` | `2px 0 8px rgba(0,0,0,0.1)` | Sidebar right edge (same shadow, rotated) |

Everything else on the dashboard landed on an existing token: the "QUALITY ASSURANCE CENTER"
wordmark measures **exactly 20px**, sidebar labels / banner subtitle / chart title 15px, stat
numerals 20px, `LEVEL n` labels and trend text 12px, and both the `LEVEL n` label and chart axis
text are exactly `#7B7979`.

**`--text-banner` 31px — resolved 2026-07-23, the snap is gone.** Three screens carry a "Welcome
to…" heading that measures between the 20 and 36 tokens: the qac_personnel dashboard banner
**31px**, the login hero **31px**, the program_representative dashboard banner **30.3px**. All three
shipped at `--text-title` (36) until the owner adopted a single new token rather than an arbitrary
size repeated per screen. One value on all three keeps the element consistent across roles; the
frames disagree by 0.7px, so no single token can be exact on every one.

Measured effect of adopting it:

| Screen | at `--text-title` 36px | at `--text-banner` 31px |
|---|---|---|
| `login/MainLogin` | 1.52% | **1.19%** |
| `qac_personnel/01-Dashboard` | 2.82% | **2.70%** |
| `program_representative/01-Dashboard` | 3.58% | **3.26%** |

Note this moved the project's "antialiasing floor" reference: the qac_personnel dashboard, long
quoted at 2.82%, is now **2.70%**. Part of that floor was always this snap.

**Login screen, second flag:** the copyright line measures **~7.5px**. `--text-micro` (9px) is the
smallest token, so that line ships ~20% wider than the prototype. No token can serve it exactly.

### Phase 1 additions (09-ui-refactor / 09b-design-system, 2026-08-20) — pending client sign-off

Spacing, radius, elevation, motion and layout scales added for the UI refactor. None invents a
colour, font or type size — the four frozen sizes and five frozen colours are unchanged. Spacing is
a 4px-base scale snapped to the nearest step from measured px clusters already in the codebase
(`[10px]x57 → 12, [16px]x51 → 16, [20px]x48 → 20, [18px]x36 → 16, [14px]x36 → 16, [22px]x26 → 24`);
radius collapses `rounded-[5|10|14|16|20]px` + `rounded-lg` to four steps; elevation keeps
`--shadow-card` as the signed-off value for `--elev-2` so no existing call site changes meaning.

```
--space-1: 4px    --space-5: 20px   --space-9:  48px    --radius-sm: 6px    --elev-0: none
--space-2: 8px    --space-6: 24px   --space-10: 56px    --radius-md: 10px   --elev-1: 0 1px 2px rgba(0,0,0,.06)
--space-3: 12px   --space-7: 32px   --space-11: 64px    --radius-lg: 16px   --elev-2: 0 2px 8px rgba(0,0,0,.10)
--space-4: 16px   --space-8: 40px   --space-12: 80px    --radius-xl: 24px   --elev-3: 0 12px 32px rgba(0,0,0,.16)
```

Motion: `--motion-fast 120ms / --motion-base 180ms / --motion-slow 260ms`, `--ease-out
cubic-bezier(.2,.8,.2,1)`, `--ease-in cubic-bezier(.4,0,1,1)`. Layout: `--page-max 1440px,
--content-max 1180px, --prose-max 68ch, --rail-w 250px, --rail-w-collapsed 72px, --bar-h 80px`.
Surface alphas (`--hairline`, `--tint-maroon`, `--tint-yellow`, `--tint-approved`) are
`color-mix()` of the frozen colours only — no new hex.

Full derivation and CSS: `plans/09b-design-system.md` §1. Values live in `src/app/globals.css`.

## Deliberately exempt — the dev role switcher

`src/components/portal/DevUserSwitcher.tsx` is the one piece of UI in the repo that does **not**
follow this file, and that is the point: it is a preview affordance, and it has to be impossible to
mistake for product UI. It uses Tailwind's default monospace stack and `9px`/`10px` type — neither
of which is a token — plus a dashed rule. Colors are still tokens (`yellow`, `gray`, `white`).

It is dev-only (`process.env.NODE_ENV`, inlined at build time, so it is dead code in a production
build) and is deleted whole when phase 3b lands. Nothing here needs sign-off; it is recorded so the
exemption is a decision on the record rather than an oversight.

## Implementation notes

- Wire these into `tailwind.config.ts` under `theme.extend.colors` / `theme.extend.fontFamily` / `theme.extend.fontSize` once the Next.js app scaffolds, so components reference Tailwind classes (e.g. `text-maroon`, `font-qac`, `text-title`) instead of raw hex/px.
- Load font files via `next/font` (local or Google Fonts) — confirm license/availability for Playfair Display SC and Inria Serif before hardcoding.
