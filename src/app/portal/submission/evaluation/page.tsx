import ProgramRepEvaluations from "@/components/portal/screens/ProgramRepEvaluations";
import { getCompletedVisits } from "@/lib/visit-evaluations";

/**
 * Nested under `/portal/submission` because the representative's rail has no
 * Feedback entry; the prefix match in `PortalSidebar.tsx` keeps "Submission"
 * highlighted here.
 */
export default async function EvaluationsPage() {
  const visits = await getCompletedVisits();
  return <ProgramRepEvaluations visits={visits} />;
}
