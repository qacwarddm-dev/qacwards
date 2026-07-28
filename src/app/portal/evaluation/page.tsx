import InternalAccreditorEvaluation from "@/components/portal/screens/InternalAccreditorEvaluation";

/**
 * `/portal/evaluation` — only the Internal Accreditor's sidebar links here, so
 * there is no role switch yet. When a second role gets an Evaluation frame this
 * becomes the same `getCurrentUser()` switch as `/portal/dashboard`.
 */
export default function EvaluationPage() {
  return <InternalAccreditorEvaluation />;
}
