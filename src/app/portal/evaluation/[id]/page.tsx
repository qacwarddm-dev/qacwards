import { notFound } from "next/navigation";
import InternalAccreditorRequirements from "@/components/portal/screens/InternalAccreditorRequirements";
import EvaluationLocked from "@/components/portal/screens/EvaluationLocked";
import SubmissionUploadModal from "@/components/portal/screens/SubmissionUploadModal";
import { getAssignmentDetail, getAssignmentRequirements } from "@/lib/assignments";
import { getIaDashboard } from "@/lib/dashboards";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * `/portal/evaluation/[id]` — client revision: the flat Narrative/Compliance/
 * Website sheet (`InternalAccreditorEvaluationDetail`, still used by nothing
 * else and kept as-is) is now fronted by an "Accreditation Requirements"
 * Areas grid, one program's 10 requirement areas with a summary/back-link
 * header and a Return/Approve (or, once past `in_progress`, a disabled
 * "Evaluate") footer. An area row's chevron opens the same "Add Document"
 * modal the Program Representative's own Requirements list already uses
 * (`SubmissionUploadModal`) — the client's reference for it is byte-identical
 * to that one, just reached from `/portal/evaluation/[id]` instead of
 * `/portal/submission`.
 *
 * Round 2 §1's gate is unchanged: an invited accreditor who has not answered
 * yet gets the accept/decline card instead.
 */
export default async function EvaluationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modal?: string; area?: string }>;
}) {
  const { id } = await params;
  const { modal, area } = await searchParams;

  const detail = await getAssignmentDetail(id);
  if (!detail) notFound();

  if (detail.myResponse === "pending" || detail.myResponse === "rejected") {
    return (
      <>
        <h1 className="sr-only">Evaluation Detail</h1>
        <EvaluationLocked assignmentId={id} detail={detail} response={detail.myResponse} />
      </>
    );
  }

  const user = await requireCurrentUser();
  const [requirements, { stats }] = await Promise.all([
    getAssignmentRequirements(id),
    getIaDashboard(user.id),
  ]);
  if (!requirements) notFound();

  const closeHref = `/portal/evaluation/${id}`;

  return (
    <>
      <h1 className="sr-only">Evaluation Detail</h1>
      <InternalAccreditorRequirements assignmentId={id} stats={stats} data={requirements} />

      {modal === "add" && area && detail.programId && detail.levelId && (
        <SubmissionUploadModal
          title="Add Document"
          programId={detail.programId}
          levelId={detail.levelId}
          submissionId={detail.submissionId}
          slots={[
            { key: "document", label: "Document", required: true, requirementAreaId: area },
            {
              key: "additional",
              label: "Additional Document (Optional)",
              requirementAreaId: area,
            },
          ]}
          closeHref={closeHref}
        />
      )}
    </>
  );
}
