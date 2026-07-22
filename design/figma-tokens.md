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

## Implementation notes

- Wire these into `tailwind.config.ts` under `theme.extend.colors` / `theme.extend.fontFamily` / `theme.extend.fontSize` once the Next.js app scaffolds, so components reference Tailwind classes (e.g. `text-maroon`, `font-qac`, `text-title`) instead of raw hex/px.
- Load font files via `next/font` (local or Google Fonts) — confirm license/availability for Playfair Display SC and Inria Serif before hardcoding.
