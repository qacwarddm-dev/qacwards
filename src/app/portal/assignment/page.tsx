import InternalAccreditorAssignment from "@/components/portal/screens/InternalAccreditorAssignment";
import QacPersonnelAssignment from "@/components/portal/screens/QacPersonnelAssignment";
import { requireCurrentUser } from "@/lib/current-user";
import { getAssignments } from "@/lib/assignments";

/**
 * `/portal/assignment` — shared URL, role-branched content. QAC Personnel and
 * Internal Accreditor both link here from their sidebars, but the frames differ
 * (qac_personnel/03-Accreditation Assignment vs internal_accreditor/02-
 * Accreditation), so the screen is chosen by the identity seam.
 *
 * Wired in B5. Both roles read the same `getAssignments()`; which rows come back
 * differs entirely by RLS — an accreditor sees the assignments they are on, QAC
 * sees all of them. No role filter is applied here, deliberately.
 */
export default async function AssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const user = await requireCurrentUser();
  const { confirm } = await searchParams;

  const assignments = await getAssignments(user.id);

  if (user.role === "internal_accreditor") {
    return (
      <InternalAccreditorAssignment
        confirm={confirm}
        assignments={assignments.map((a) => ({
          id: a.id,
          campus: a.campus,
          college: a.college,
          program: a.program,
          level: a.level,
          status: a.status.replace(/_/g, " "),
          myResponse: a.myResponse,
        }))}
      />
    );
  }
  return <QacPersonnelAssignment assignments={assignments} />;
}
