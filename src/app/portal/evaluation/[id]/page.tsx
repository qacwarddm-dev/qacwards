import { notFound } from "next/navigation";
import InternalAccreditorEvaluationDetail from "@/components/portal/screens/InternalAccreditorEvaluationDetail";
import EvaluationLocked from "@/components/portal/screens/EvaluationLocked";
import { getAssignmentDetail, getEvaluation, scoreDisplay } from "@/lib/assignments";
import { getSignatories } from "@/lib/accreditor";
import { ensureEvaluation, ensureEvaluationItems } from "@/lib/assignment-actions";

/**
 * `/portal/evaluation/[id]` — the per-document evaluation sheet
 * (internal_accreditor/03.1 = `?state=review`, 03.2 = `?state=done`).
 *
 * Both frames are 1x exports and cannot be pixel-verified; the screen is
 * transcribed by eye and flagged for re-export.
 *
 * The sheet (`evaluations` + its `evaluation_items`) is created lazily on
 * first open, same reasoning as submissions (D-14): most assignments are
 * never opened by every team member on day one.
 *
 * Round 2 §1 puts a gate in front of that: an invited accreditor who has not
 * answered yet gets the accept/decline card instead of the sheet, and one who
 * declined gets nothing to work on. Accepting is what unblocks the flow, which
 * is the whole point of the invitation. QAC is not on the team and so has no
 * invitation to answer — `myResponse` is null for them and they pass straight
 * through.
 */
export default async function EvaluationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const state = query.state === "done" ? "done" : "review";

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

  const ensured = await ensureEvaluation(id);
  if (ensured.ok) await ensureEvaluationItems(id, ensured.evaluationId);

  const [evaluation, signatories] = await Promise.all([
    getEvaluation(id),
    getSignatories(id),
  ]);

  return (
    <>
      <h1 className="sr-only">Evaluation Detail</h1>
      <InternalAccreditorEvaluationDetail
        state={state}
        detail={detail}
        items={evaluation?.evaluation_items ?? []}
        score={scoreDisplay(evaluation ?? null)}
        signatories={signatories}
      />
    </>
  );
}
