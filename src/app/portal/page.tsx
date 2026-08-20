import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import type { PortalRole } from "@/components/portal/portal-nav";

/**
 * Role dispatcher.
 *
 * Every role currently lands on `/portal/dashboard`, which renders its own
 * role's screen — but the mapping is written out per role rather than left as a
 * single redirect, because B3 gives `qac_admin` a Settings home and this is the
 * one place that decision belongs. A role added without a landing page fails
 * here, loudly, instead of silently inheriting someone else's dashboard.
 */
const HOME_BY_ROLE: Record<PortalRole, string> = {
  program_representative: "/portal/dashboard",
  internal_accreditor: "/portal/dashboard",
  qac_personnel: "/portal/dashboard",
  qac_admin: "/portal/dashboard",
};

export default async function PortalIndex() {
  const user = await requireCurrentUser();
  redirect(HOME_BY_ROLE[user.role]);
}
