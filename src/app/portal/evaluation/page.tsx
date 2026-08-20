import InternalAccreditorEvaluation from "@/components/portal/screens/InternalAccreditorEvaluation";
import { getMyEvaluationAssignments } from "@/lib/assignments";

/**
 * `/portal/evaluation` — only the Internal Accreditor's sidebar links here, so
 * there is no role switch yet. When a second role gets an Evaluation frame this
 * becomes the same `getCurrentUser()` switch as `/portal/dashboard`.
 */
export default async function EvaluationPage() {
  const rows = await getMyEvaluationAssignments();
  return (
    <>
      <h1 className="sr-only">Evaluation</h1>
      <InternalAccreditorEvaluation rows={rows} />
    </>
  );
}
