import Panel from "./Panel";
import { StatRow, type Stat } from "./StatCard";

/**
 * The four bordered tiles at the top of every Internal Accreditor Evaluation
 * screen (Programs list and, per program, Accreditation Requirements) —
 * same `Stat[]` `getIaDashboard` already computes for the dashboard.
 */
export default function EvaluationSummary({ stats }: { stats: Stat[] }) {
  return (
    <Panel title="Evaluation Summary">
      <StatRow stats={stats} gap={20} variant="outline" />
    </Panel>
  );
}
