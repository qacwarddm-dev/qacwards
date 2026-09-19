import InternalAccreditorEvaluation from "@/components/portal/screens/InternalAccreditorEvaluation";
import { getIaDashboard } from "@/lib/dashboards";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * `/portal/evaluation` — only the Internal Accreditor's sidebar links here, so
 * there is no role switch yet. When a second role gets an Evaluation frame this
 * becomes the same `getCurrentUser()` switch as `/portal/dashboard`.
 */
export default async function EvaluationPage() {
  const user = await requireCurrentUser();
  const data = await getIaDashboard(user.id);
  return (
    <>
      <h1 className="sr-only">Evaluation</h1>
      <InternalAccreditorEvaluation data={data} />
    </>
  );
}
