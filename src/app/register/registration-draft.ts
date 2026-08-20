"use client";

import { CAMPUSES as REF_CAMPUSES } from "@/lib/reference/campuses";
import { COLLEGES as REF_COLLEGES } from "@/lib/reference/colleges";
import { SYSTEM_ROLES } from "./register-options";

/**
 * The half-filled account, carried across the four register steps.
 *
 * The built flow is account → verify webmail → create password → profile, and
 * each step is its own route, so something has to hold the first step's fields
 * until there is an account to attach them to. `sessionStorage` rather than a
 * cookie or a server draft table: it dies with the tab, never reaches the
 * network, and a half-finished registration leaves nothing behind.
 *
 * **How this maps onto Supabase Auth.** The frames verify the webmail *before*
 * asking for a password, which `signUp` cannot do — it wants both at once. The
 * OTP flow fits the built order exactly:
 *
 *   1. account  → `signInWithOtp({ shouldCreateUser: true, data })` mails a code
 *   2. verify   → `verifyOtp` creates the auth.users row and signs them in.
 *                 That insert fires the @pup.edu.ph trigger and
 *                 `handle_new_user`, which reads `data` out of
 *                 raw_user_meta_data and writes the profile row.
 *   3. password → `updateUser({ password })` on the session that now exists
 *   4. profile  → avatar upload, then done
 *
 * So no step invents an account and none of the built screens moved.
 */

export type RegistrationDraft = {
  surname: string;
  givenName: string;
  middleInitial: string;
  webmail: string;
  /** UI label, e.g. "Academic Program". */
  roleLabel: string;
  /** Campus display name, e.g. "Sta. Mesa, Manila". */
  campus: string;
  /** College display name; empty unless main campus. */
  college: string;
  position: string;
};

const KEY = "qac_registration_draft";

export function saveDraft(draft: RegistrationDraft): void {
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function readDraft(): RegistrationDraft | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RegistrationDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  sessionStorage.removeItem(KEY);
}

/**
 * Project the draft into the `data` blob `handle_new_user` reads.
 *
 * Names are translated to the natural keys the reference tables use — the slug
 * for a campus, the code for a college — because the trigger looks rows up by
 * those, not by display text. Doing the translation here keeps the SQL free of
 * string matching against user-visible labels.
 *
 * The role is sent as the **enum value**, never the label: `program_representative`,
 * not "Academic Program" (open item O-4).
 */
export function draftToAuthMetadata(draft: RegistrationDraft): Record<string, string> {
  const role =
    SYSTEM_ROLES.find((r) => r.label === draft.roleLabel)?.role ??
    "program_representative";
  const campus = REF_CAMPUSES.find((c) => c.name === draft.campus)?.slug ?? "";
  const college = REF_COLLEGES.find((c) => c.name === draft.college)?.code ?? "";

  return {
    role,
    surname: draft.surname,
    given_name: draft.givenName,
    middle_initial: draft.middleInitial,
    campus,
    college,
    position: draft.position,
  };
}
