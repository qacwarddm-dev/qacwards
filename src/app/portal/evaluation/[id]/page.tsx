import { notFound } from "next/navigation";
import InternalAccreditorEvaluationDetail from "@/components/portal/screens/InternalAccreditorEvaluationDetail";
import { getAssignmentDetail, getEvaluation, scoreDisplay } from "@/lib/assignments";
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

  const ensured = await ensureEvaluation(id);
  if (ensured.ok) await ensureEvaluationItems(id, ensured.evaluationId);

  const evaluation = await getEvaluation(id);

  return (
    <InternalAccreditorEvaluationDetail
      state={state}
      detail={detail}
      items={evaluation?.evaluation_items ?? []}
      score={scoreDisplay(evaluation ?? null)}
    />
  );
}
