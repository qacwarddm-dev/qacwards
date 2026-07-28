import InternalAccreditorAssignment from "@/components/portal/screens/InternalAccreditorAssignment";
import QacPersonnelAssignment from "@/components/portal/screens/QacPersonnelAssignment";
import { getCurrentUser } from "@/lib/current-user";

/**
 * `/portal/assignment` — shared URL, role-branched content. QAC Personnel and
 * Internal Accreditor both link here from their sidebars, but the frames differ
 * (qac_personnel/03-Accreditation Assignment vs internal_accreditor/02-
 * Accreditation), so the screen is chosen by the identity seam.
 */
export default async function AssignmentPage() {
  const user = await getCurrentUser();

  if (user.role === "internal_accreditor") return <InternalAccreditorAssignment />;
  return <QacPersonnelAssignment />;
}
