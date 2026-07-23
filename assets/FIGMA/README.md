# Figma frame exports

Drop the exported portal screens here. One folder per role, plus `_shared`, `login` and
`register`.

```
_shared/                 the sidebar / top bar, and anything that repeats on every screen
login/                   the login screen
register/                sign-up — one subfolder per role, since each role registers differently
  program_representative/
  internal_accreditor/
  qac_personnel/
  qac_admin/
program_representative/  the role's portal screens
internal_accreditor/
qac_personnel/
qac_admin/
```

Role folder names are identical in both places, and match the slugs the code uses. `Public` has no
`register/` subfolder — it is the unauthenticated visitor, so there is no account to create.

Put any shared step of the sign-up flow (a role-picker screen, an email-verification screen, a
"pending approval" screen) directly in `register/`, not inside a role subfolder.

## How to export

In Figma: select the frame → right panel → **Export** → **PNG** at **2x** → Export.

2x matters. Text is measured by cap height to recover font sizes, and at 1x the measurement is
±2px — enough to pick the wrong token. At 2x it is exact.

## How to name

Number them in the order a user would move through them, then a short name:

```
program_representative/
  01-dashboard.png
  02-my-programs.png
  03-program-detail.png
  04-upload-document.png
  05-submission-confirmation.png
```

The numbers set the build order, so if one screen should be built before another, number it that
way. Lowercase, hyphens, no spaces.

## Also worth exporting

- **Hover / open states** — a dropdown expanded, a menu item hovered, a button pressed. The About
  dropdown on the public site was matched to 1px only because there was a hover screenshot.
  Without one, interactive states are a guess. Suffix them: `02-my-programs-hover.png`.
- **Empty states** — what a screen looks like with no data yet.
- **Error / validation states** — a form with a failed field.
- **Modals and confirmations** as their own frames.

Anything not exported gets invented, then reworked when the client sees it.

## Frame width — settled

**1440x810.** A 2x export is therefore 2880x1620, and every measurement taken off a PNG is
halved. Confirmed against `qac_personnel/01-Dashboard.png`: halving lands the QAC wordmark on
exactly 20px, nav labels 15, stat numerals 20, `LEVEL n` 12, top bar 59 — all existing tokens.

Keep every future export at 2x of the same 1440 frame. A folder exported at 1x or 3x silently
breaks every measurement recipe in `design/prototype-notes.md`.

## Naming — the existing folder does not follow the rule

`qac_personnel/` was exported before this README and uses `01-Dashboard.png`, plus a space in
`03-Accreditation Assignment.png`. New exports should follow the lowercase-hyphen rule above;
don't copy the existing folder's style.
