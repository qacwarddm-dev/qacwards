# Phase 1 — Shell

## Goal

Scaffold the Next.js app and build the shared layout chrome (navbar + footer) that every page reuses, wired to `design/figma-tokens.md`.

## Depends on

Nothing (first phase).

## Decisions (best-practice defaults, project owner delegated call)

- Package manager: **pnpm**
- Layout: `src/app` (App Router), route groups `(public)` and `(portal)` added when phase 3 needs them
- Styling: Tailwind, tokens from `design/figma-tokens.md` mapped into `tailwind.config.ts` (`colors.maroon`, `colors.yellow`, `colors.gray`, `fontFamily.*`, `fontSize.*`)
- Fonts loaded via `next/font/google` where available (Inter, Poppins, Roboto Serif); Playfair Display SC and Inria Serif — confirm Google Fonts availability, fall back to `next/font/local` if not
- Icons: pick one icon set (lucide-react) for footer email/phone glyphs and navbar chevron/account icon

## Navbar (from client screenshot)

- Left: logo lockup — "Polytechnic University of the Philippines" (small line) + "Quality Assurance Center" (bold, large). Font split per tokens: "PUP" portion styled Playfair Display SC, "QAC" portion Poppins.
- **Logo asset blocker**: real seal/logo graphic not yet delivered (requested from other devs). Use text-only wordmark fallback now; structure `public/assets/logos/` so the image drops in later without layout rework.
- Nav links, left to right: **Home** (active state = maroon pill background, white text), **About** (dropdown, chevron icon — see 02 for sub-pages), **Gov. Recognitions**, **Accreditations**
- Right: circular account/profile icon — links to login (routes to auth, built in phase 3; stub route for now)
- Sticky top, white background, black/maroon text

## Footer (from client screenshot)

Standard GOVPH-style footer, maroon (`#800000`) background, white/yellow text:

- Col 1: Philippines seal graphic (asset blocker, same as above) + "Republika ng Pilipinas" heading + "All content is public domain unless otherwise stated."
- Col 2: "About GOVPH" heading + short blurb + links "Official Gazette", "Open Data Portal"
- Col 3: "Government Links" heading + list: Office of the President, Office of the Vice President, Senate of the Philippines, House of Representatives, Supreme Court, Court of Appeals, Sandiganbayan
- Col 4: QAC seal (asset blocker) + email icon + `qac@pup.edu.ph` + phone icon + "Contact Us" + `(+632) 335-1787 or 335-1777 local 242`
- Bottom bar, centered: `© 2024 Polytechnic University of the Philippines`

Static component, no auth-state variation — reused as-is across public and portal pages unless phase 3 says otherwise.

## Tasks

- [x] `pnpm create next-app` (TS, Tailwind, App Router, `src/` dir) — Next 16.2.10, React 19.2.4, Tailwind v4
- [x] Wire `design/figma-tokens.md` into `src/app/globals.css` `@theme` (Tailwind v4 — no `tailwind.config.ts`)
- [x] Load fonts via `next/font` — `src/lib/fonts.ts`, all 5 from Google Fonts
- [x] Build `Navbar` component — real PUP seal (no fallback needed), About dropdown, account icon → `/login` stub
- [x] Build `Footer` component (static content per above)
- [x] Root layout wraps all pages with Navbar + Footer
- [x] `public/assets/logos/` populated from `assets/LOGO/`
- [ ] Screenshot resulting shell (empty page body) against client screenshots for sign-off — **awaiting project owner**

## Acceptance criteria

- Navbar and footer visually match client screenshots (modulo missing logo graphics)
- All colors/fonts/sizes traceable to `design/figma-tokens.md`, no hardcoded values
- Layout responsive at mobile/tablet/desktop breakpoints
