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
 *
 * Round 2 §2 adds a third case: a QAC Personnel who also acts as an Internal
 * Accreditor gets both panels stacked, because both are true of them. Their
 * invitations are filtered out of the full QAC list by `myResponse`, which is
 * null on every assignment they are not personally on — the accreditor panel
 * cannot simply take everything RLS returned, since RLS returns everything to
 * QAC.
 */
export default async function AssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  const user = await requireCurrentUser();
  const { confirm } = await searchParams;

  const assignments = await getAssignments(user.id);

  const myInvitations = assignments
    .filter((a) => a.myResponse !== null)
    .map((a) => ({
      id: a.id,
      campus: a.campus,
      college: a.college,
      program: a.program,
      level: a.level,
      status: a.status,
      myResponse: a.myResponse,
    }));

  if (user.role === "internal_accreditor") {
    return (
      <>
        <h1 className="sr-only">Assignment</h1>
        <InternalAccreditorAssignment confirm={confirm} assignments={myInvitations} />
      </>
    );
  }

  return (
    <>
      <h1 className="sr-only">Assignment</h1>
      <QacPersonnelAssignment assignments={assignments} />
      {/* Only once they actually hold one. An empty second panel under the QAC
          table would be permanent furniture on every dual-role account. */}
      {user.actsAsAccreditor && myInvitations.length > 0 && (
        <InternalAccreditorAssignment
          confirm={confirm}
          assignments={myInvitations}
          title="My Accreditation Assignments"
        />
      )}
    </>
  );
}
