# Round 2 — Assignment Accept/Decline, Accreditor Onboarding, Specialty/E-Sign

Source: client to-do notes, 2026-09-06. PRD before scaffold — decisions locked below, no code yet.

## 1. Accreditation Assignment — Accept/Decline

- Actor: Internal Accreditor. "Program Accreditor" in client notes = same role, naming not finalized
  with client yet (Internal Accreditor vs Program Accreditor — cosmetic, pick one before ship).
- Flow: QAC Personnel creates assignment (existing, `createAssignmentForProgramLevel`) → assigned
  Internal Accreditor sees it, accepts or declines.
- Decline: assignment goes back to QAC Personnel queue (manual reassign by QAC Personnel — no
  auto-reassign logic in this round).
- Accept: unblocks existing evaluation flow (`under_evaluation` / `openRetake()`).
- New state needed on assignment: `pending_response` / `accepted` / `declined` (naming TBD at
  schema time) — distinct from submission status, which is separate already
  (`assignment-actions.ts`).

## 2. QAC Admin — Add Internal Accreditor

- Not a new-user invite flow. Promote an existing QAC Personnel account to Internal Accreditor role.
- Use case: no Internal Accreditor available for a specialty → QAC Admin assigns a co-QAC-Personnel
  as Internal Accreditor (role add, not role replace — needs confirming whether it's dual-role or
  swap. Default to dual-role since notes say "add", not "convert").
- Lives under QAC Admin → User Management → Edit user details (existing section, extend with a role
  toggle/add-role action).

## 3. Internal Accreditor — Specialty (changeable)

- Editable by both: Internal Accreditor (self, on own profile) and QAC Admin (via User Management
  edit).
- Same underlying field/table, two entry points.

## 4. Internal Accreditor — E-sign profile details

- Signature captured once, stored on the Internal Accreditor's profile (not per-document).
- Reused automatically wherever their signature is required on generated documents/evaluations.
- Needs: signature capture UI (draw or type — TBD), storage (Supabase Storage, consistent with
  existing doc storage pattern), and a "signed by" render step wherever accreditor sign-off appears
  on output docs.

## Explicitly out of scope for this round

- **QAC Personnel dashboard dropdown search** — kit component (`SearchField.tsx`) already exists but
  is NOT wired into `QacPersonnelDashboard.tsx` (only used in `RepMapper.tsx` /
  `ProgramRepDocuments.tsx`). Confirmed not done. Client said skip — separate task later.
- **NDS Validation (Program Representative, manual credential input)** — term unclear, client
  clarification needed before scoping. Do not build.

## Open questions for client (not blocking start, but need answers before ship)

- Final role label: "Internal Accreditor" vs "Program Accreditor" — pick one name system-wide.
- Add-Internal-Accreditor: confirm dual-role (keeps QAC Personnel + gains Internal Accreditor) vs
  role swap.
- Signature input method: drawn (canvas) vs typed/font-rendered vs uploaded image.
- What "NDS" stands for and what the manual-creds-input screen actually needs to capture.

## Suggested build order

1. Assignment accept/decline state + UI (biggest workflow gap, unblocks the round-1 assignment work).
2. QAC Admin add-Internal-Accreditor (small, extends existing User Management edit screen).
3. Specialty self-edit + admin-edit (shared field, two surfaces).
4. E-sign capture + reuse on documents (needs storage decision, likely largest surface area).
