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
| `--text-small` | 10px | "Polytechnic University of the Philippines" in the portal top bar |
| `--text-micro` | 9px | Chart axis labels (300 / 0 / I–IV) |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.1)` | Banner / stat card / chart card elevation |
| `--shadow-sidebar` | `2px 0 8px rgba(0,0,0,0.1)` | Sidebar right edge (same shadow, rotated) |

Everything else on the dashboard landed on an existing token: the "QUALITY ASSURANCE CENTER"
wordmark measures **exactly 20px**, sidebar labels / banner subtitle / chart title 15px, stat
numerals 20px, `LEVEL n` labels and trend text 12px, and both the `LEVEL n` label and chart axis
text are exactly `#7B7979`.

**One snap, flagged — and it has now come up twice.** The dashboard banner heading "Welcome to the
QAC Dashboard!" measures **31px** in the prototype, and so does the login screen's "Welcome to QAC
Website" (`assets/FIGMA/login/MainLogin.png`). There is no 31px token, so both render at
`--text-title` (36px), the nearest one — same rule the phase-2 public pages followed.

Cost of the snap, measured on the login screen: the whole-screen pixel diff is **1.52% at 36px vs
1.19% at 31px**, and the heading's ink runs 28px wider than the prototype (205 vs 177 for "Welcome
to"). At an exact `text-[31px] leading-[36px]` both lines match the prototype to ≤0.5px. Say the
word and it becomes exact — and if it does, 31px should probably become a token rather than an
arbitrary value repeated on two screens.

**Login screen, second flag:** the copyright line measures **~7.5px**. `--text-micro` (9px) is the
smallest token, so that line ships ~20% wider than the prototype. No token can serve it exactly.

## Implementation notes

- Wire these into `tailwind.config.ts` under `theme.extend.colors` / `theme.extend.fontFamily` / `theme.extend.fontSize` once the Next.js app scaffolds, so components reference Tailwind classes (e.g. `text-maroon`, `font-qac`, `text-title`) instead of raw hex/px.
- Load font files via `next/font` (local or Google Fonts) — confirm license/availability for Playfair Display SC and Inria Serif before hardcoding.
