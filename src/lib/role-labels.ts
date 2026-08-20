import type { PortalRole } from "@/components/portal/portal-nav";

/**
 * How each role is named in the UI. `program_representative` reads "Academic
 * Program" per `docs/OtherContext.txt` while the enum keeps its original value
 * (open item O-4).
 *
 * Split out of `current-user.ts` because that module is server-only by
 * construction (it builds the cookie-backed Supabase client) and a client
 * component such as `UserAdmin` needs this map without pulling `next/headers`
 * into the browser bundle.
 */
export const ROLE_LABELS: Record<PortalRole, string> = {
  program_representative: "Academic Program",
  internal_accreditor: "Internal Accreditor",
  qac_personnel: "QAC Personnel",
  qac_admin: "QAC Admin",
};
