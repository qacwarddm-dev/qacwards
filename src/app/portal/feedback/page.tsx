import QacFeedback from "@/components/portal/screens/qac/QacFeedback";
import RepFeedback from "@/components/portal/screens/rep/RepFeedback";
import { requireCurrentUser } from "@/lib/current-user";
import { getFeedbackData } from "@/lib/qac-feedback";
import { getGeneralTemplate, getRepPrograms } from "@/lib/rep-portal";
import { getCompletedVisits } from "@/lib/visit-evaluations";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ tab?: string; doc?: string }> }) {
  const user = await requireCurrentUser();
  const { tab, doc } = await searchParams;
  if (user.role === "program_representative") {
    const [programs, visits, tpl] = await Promise.all([getRepPrograms(), getCompletedVisits(), getGeneralTemplate()]);
    return <RepFeedback programs={programs} visits={visits} me={user.name} tpl={tpl} initialTab={tab === "eval" ? "eval" : "qac"} initialDoc={doc} />;
  }
  return <QacFeedback data={await getFeedbackData()} />;
}
