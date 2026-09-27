import { notFound, redirect } from "next/navigation";
import QacPersonnelAccreditationDetail from "@/components/portal/screens/QacPersonnelAccreditationDetail";
import { AreaDocumentsModal } from "@/components/portal/kit";
import {
  getAccreditationOverview,
  getAreaDocuments,
  getAssignmentRequirements,
} from "@/lib/assignments";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * `/portal/assignment/[id]` — a Programs row on QAC's Accreditation screen
 * (docs/qac_per.pdf, page 2). An accreditor's own view of the same assignment
 * is `/portal/evaluation/[id]`, so they are sent there.
 */
export default async function AccreditationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ area?: string }>;
}) {
  const [{ id }, { area }, user] = await Promise.all([params, searchParams, requireCurrentUser()]);

  if (user.role === "internal_accreditor") redirect(`/portal/evaluation/${id}`);
  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");

  const [requirements, overview] = await Promise.all([
    getAssignmentRequirements(id),
    getAccreditationOverview(),
  ]);
  if (!requirements) notFound();

  const { detail } = requirements;
  const openArea = area ? requirements.areas.find((a) => a.id === area) : undefined;
  const documents =
    openArea && detail.submissionId ? await getAreaDocuments(detail.submissionId, openArea.id) : [];

  return (
    <>
      <h1 className="sr-only">Accreditation Requirements</h1>
      <QacPersonnelAccreditationDetail
        assignmentId={id}
        summary={overview.summary}
        data={requirements}
      />

      {openArea && (
        <AreaDocumentsModal
          areaName={openArea.name}
          program={detail.program}
          documents={documents}
          closeHref={`/portal/assignment/${id}`}
        />
      )}
    </>
  );
}
