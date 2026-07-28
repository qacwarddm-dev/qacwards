import type { PortalUserKey } from "@/components/portal/data";

/**
 * Phase-3a demo shortcut. There is no real auth yet, so the login form maps a
 * typed role name to a portal role and drops you on that role's dashboard:
 * type e.g. "internal accreditor" in the webmail and password fields and Login
 * takes you to the Internal Accreditor portal.
 *
 * **This is not authentication** — it only picks which fake person the static
 * screens draw, exactly like `/portal/dev/switch`. It disappears with the seam
 * in phase 3b, where the role comes from the account, never a typed string.
 */
const ROLE_BY_KEYWORD: Record<string, PortalUserKey> = {
  "internal accreditor": "internal_accreditor",
  internal_accreditor: "internal_accreditor",
  accreditor: "internal_accreditor",
  "program representative": "program_representative",
  "academic program": "program_representative",
  program_representative: "program_representative",
  program: "program_representative",
  "qac personnel": "qac_personnel",
  qac_personnel: "qac_personnel",
  personnel: "qac_personnel",
  qac: "qac_personnel",
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Resolve the role to sign in as from what the user typed, falling back to the
 * role the picker carried in `?as=`. Returns null only when nothing matches, so
 * the caller can leave the user on the form.
 */
export function resolveDemoRole(
  webmail: string,
  password: string,
  picked?: string,
): PortalUserKey | null {
  const typed =
    ROLE_BY_KEYWORD[normalize(password)] ?? ROLE_BY_KEYWORD[normalize(webmail)];
  if (typed) return typed;
  if (picked && picked in ROLE_BY_KEYWORD) return ROLE_BY_KEYWORD[picked];
  if (
    picked === "internal_accreditor" ||
    picked === "program_representative" ||
    picked === "qac_personnel"
  ) {
    return picked;
  }
  return null;
}
