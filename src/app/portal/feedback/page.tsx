import FeedbackOverview from "@/components/portal/screens/FeedbackOverview";
import { getFeedbackList, getFeedbackMonthlySeries } from "@/lib/feedback";

export default async function FeedbackPage() {
  const [entries, monthly] = await Promise.all([getFeedbackList(), getFeedbackMonthlySeries()]);
  return <FeedbackOverview entries={entries} monthly={monthly} />;
}
