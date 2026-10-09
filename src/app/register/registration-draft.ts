"use client";

import { CAMPUSES as REF_CAMPUSES } from "@/lib/reference/campuses";
import { COLLEGES as REF_COLLEGES } from "@/lib/reference/colleges";
import { SYSTEM_ROLES } from "./register-options";

/**
 * The half-filled registration, carried across the register steps in
 * `sessionStorage` (dies with the tab, never reaches the network on its own).
 *
 * No account exists until the password step:
 *   1. details  → `sendRegistrationOtp` stores a temporary code row and mails it
 *   2. verify   → `verifyRegistrationOtp` checks it and sets the `qac_reg` cookie
 *   3. password → `completeRegistration` inserts the user and hashes the password
 *   4. profile  → avatar upload, then done
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
  /** Expertise area name; Internal Accreditor only. */
  expertise: string;
  /** Epoch ms the mailed code stops working. */
  codeExpiresAt?: number;
  /** Epoch ms the next code may be requested. */
  resendAt?: number;
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
