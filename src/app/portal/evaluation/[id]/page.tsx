import InternalAccreditorEvaluationDetail from "@/components/portal/screens/InternalAccreditorEvaluationDetail";

/**
 * `/portal/evaluation/[id]` — the per-document evaluation sheet
 * (internal_accreditor/03.1 = `?state=review`, 03.2 = `?state=done`).
 *
 * Both frames are 1x exports and cannot be pixel-verified; the screen is
 * transcribed by eye and flagged for re-export. The `id` is unused for now (one
 * fake evaluation), but the route is per-document so it survives the backend.
 */
export default async function EvaluationDetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = params.state === "done" ? "done" : "review";
  return <InternalAccreditorEvaluationDetail state={state} />;
}
