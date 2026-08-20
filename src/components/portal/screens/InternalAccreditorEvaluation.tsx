import { Download, GitCommitHorizontal } from "lucide-react";
import { ASSIGNMENT_STEPS } from "../data";
import type { EvaluationListRow } from "@/lib/assignments";
import { type Column, DataTable, Panel, Stepper } from "../kit";

/**
 * Internal Accreditor → Evaluation (list) —
 * assets/FIGMA/internal_accreditor/03-DocumentEvaluation.png.
 *
 * The same `Panel` + leading-marker `DataTable` the Assignment screens use,
 * with a download action in the panel header and the evaluation stepper
 * expanded under the second row. Rows link to the per-document evaluation sheet
 * (`03.1` / `03.2`), which lives at `/portal/evaluation/[id]`.
 *
 * B9/task 2 made this the fetching half: `rows` comes from
 * `getMyEvaluationAssignments()` (src/lib/assignments.ts).
 */
const COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[150px]" },
  { key: "college", header: "College", width: "w-[140px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[130px]" },
  { key: "accreditor", header: "Accreditor Assigned", width: "w-[190px]" },
  { key: "score", header: "Score", width: "w-[150px]" },
];

/** `assignment_status` in its five-step order — positionally the same order
 *  `ASSIGNMENT_STEPS`' labels were drawn in. */
const STATUS_ORDER = ["assigned", "in_progress", "for_psv", "evaluated", "score_returned"];

function stepsForStatus(status: string) {
  const at = STATUS_ORDER.indexOf(status);
  return ASSIGNMENT_STEPS.map((step, i) => ({ ...step, done: at >= 0 && i <= at }));
}

export default function InternalAccreditorEvaluation({ rows: data }: { rows: EvaluationListRow[] }) {
  const rows = data.map((e, i) => ({
    id: e.id,
    href: `/portal/evaluation/${e.id}`,
    cells: {
      campus: e.campus,
      college: e.college,
      program: <span className="block truncate">{e.program}</span>,
      level: e.level,
      accreditor: e.accreditor,
      score: <span className="italic text-gray">{e.score}</span>,
    },
    // The most recently created assignment is the one worth showing expanded
    // — data is ordered newest-first, so that is the first row, not the last.
    detail:
      i === 0 ? (
        <div className="px-[54px] pb-[26px] pt-[10px]">
          <Stepper steps={stepsForStatus(e.status)} />
        </div>
      ) : undefined,
  }));

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <Panel
        title="Document Evaluation"
        action={
          <button
            type="button"
            className="flex items-center gap-[8px] text-subheading font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
          >
            <Download className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            Download Accreditation Visit Evaluation Form
          </button>
        }
      >
        {rows.length > 0 ? (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            leading={() => (
              <GitCommitHorizontal
                className="h-[20px] w-[20px] text-maroon"
                strokeWidth={2}
                aria-hidden
              />
            )}
          />
        ) : (
          <p className="px-[54px] py-[30px] text-regular text-gray">
            No assignments yet. They appear here once QAC assigns you to a submission.
          </p>
        )}
      </Panel>
    </div>
  );
}
