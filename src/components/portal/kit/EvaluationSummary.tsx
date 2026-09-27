import Panel from "./Panel";
import { StatRow, type Stat } from "./StatCard";

/**
 * The bordered tiles at the top of the Internal Accreditor's Evaluation
 * screens ("Evaluation Summary", `getIaDashboard`'s stats) and QAC
 * Personnel's Accreditation screens ("Accreditation Summary", PSV–Level IV).
 */
export default function EvaluationSummary({
  stats,
  title = "Evaluation Summary",
}: {
  stats: Stat[];
  title?: string;
}) {
  return (
    <Panel title={title}>
      <StatRow stats={stats} gap={20} variant="outline" />
    </Panel>
  );
}
