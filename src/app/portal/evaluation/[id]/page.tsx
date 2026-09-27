import { notFound } from "next/navigation";
import InternalAccreditorRequirements from "@/components/portal/screens/InternalAccreditorRequirements";
import EvaluationLocked from "@/components/portal/screens/EvaluationLocked";
import AreaDocumentsModal from "@/components/portal/screens/AreaDocumentsModal";
import {
  getAreaDocuments,
  getAssignmentDetail,
  getAssignmentRequirements,
  getEvaluationSheet,
  getLatestReturn,
} from "@/lib/assignments";
import { getIaDashboard } from "@/lib/dashboards";
import { requireCurrentUser } from "@/lib/current-user";
import { HEADER_KEYS } from "@/lib/evaluation-sheet";

/**
 * `/portal/evaluation/[id]` — docs/internal_accreditor.pdf: the Areas grid with
 * Return (confirm → note) / Approve (confirm), then Evaluate gated on the site
 * visit date. An Area row opens the programme's uploaded files for that area,
 * read-only (`?area=<id>`).
 *
 * Round 2 §1's gate is unchanged: an invited accreditor who has not answered
 * yet gets the accept/decline card instead.
 */
export default async function EvaluationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const { id } = await params;
  const { area } = await searchParams;

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
  const [requirements, { stats }, lastReturn, sheet] = await Promise.all([
    getAssignmentRequirements(id),
    getIaDashboard(user.id),
    detail.submissionId ? getLatestReturn(detail.submissionId) : null,
    getEvaluationSheet(id),
  ]);
  if (!requirements) notFound();

  const openArea = area ? requirements.areas.find((a) => a.id === area) : undefined;
  const documents =
    openArea && detail.submissionId ? await getAreaDocuments(detail.submissionId, openArea.id) : [];

  return (
    <>
      <h1 className="sr-only">Evaluation Detail</h1>
      <InternalAccreditorRequirements
        assignmentId={id}
        stats={stats}
        data={requirements}
        lastReturn={lastReturn}
        visitAddress={sheet.values[HEADER_KEYS.address] ?? ""}
        visitDate={sheet.values[HEADER_KEYS.visitDate] ?? detail.siteVisitDate ?? ""}
      />

      {openArea && (
        <AreaDocumentsModal
          areaName={openArea.name}
          program={detail.program}
          documents={documents}
          closeHref={`/portal/evaluation/${id}`}
        />
      )}
    </>
  );
}
