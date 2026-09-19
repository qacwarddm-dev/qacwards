import type { IaDashboard } from "@/lib/dashboards";
import { EvaluationSummary, Panel, ProgressRow, RowList } from "../kit";

/**
 * Internal Accreditor → Evaluation (list) — client revision replacing the
 * table-based assets/FIGMA/internal_accreditor/03-DocumentEvaluation.png
 * frame (no updated Figma export on disk, rebuilt from the client's pasted
 * screenshot, same situation as `InternalAccreditorDashboard`).
 *
 * The four summary tiles and the per-program readiness list are the same
 * numbers the dashboard already computes (`getIaDashboard`) — this screen
 * just gives them their own page instead of sharing the dashboard with the
 * schedule/calendar cards. Each program row is one assignment, same as the
 * old table's rows; the chevron still opens `/portal/evaluation/[id]`.
 */
export default function InternalAccreditorEvaluation({ data }: { data: IaDashboard }) {
  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <EvaluationSummary stats={data.stats} />

      <p className="mb-[14px] mt-[26px] text-regular text-gray">Programs</p>

      <Panel title="Programs">
        {data.evaluationProgress.length > 0 ? (
          <RowList>
            {data.evaluationProgress.map((p) => (
              <ProgressRow
                key={p.id}
                label={p.program}
                marker={false}
                meta={[p.campus, p.level]}
                percent={p.readiness}
                href={`/portal/evaluation/${p.id}`}
              />
            ))}
          </RowList>
        ) : (
          <p className="px-[4px] py-[10px] text-regular text-gray">
            No assignments yet. They appear here once QAC assigns you to a submission.
          </p>
        )}
      </Panel>
    </div>
  );
}
