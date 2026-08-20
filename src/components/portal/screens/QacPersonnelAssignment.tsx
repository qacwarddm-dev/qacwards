import { GitCommitHorizontal, Plus } from "lucide-react";
import type { AssignmentRow } from "@/lib/assignments";
import { ASSIGNMENT_STEPS } from "../data";
import { Button, Card, type Column, DataTable, EmptyState, PanelHeader, Stepper } from "../kit";

/** assets/FIGMA/qac_personnel/03-Accreditation Assignment.png */
// Widths keep "Bachelor of Science in Information Technology" on one line, as
// the prototype has it, and land each header near its measured centre.
const COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[125px]" },
  { key: "college", header: "College", width: "w-[85px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[65px]" },
  { key: "accreditor", header: "Accreditor Assigned", width: "w-[185px]" },
  { key: "score", header: "Score", width: "w-[145px]" },
];

// `ASSIGNMENT_STEPS`' five labels are ordered to match `assignment_status`'s
// five enum values (assigned → in_progress → for_psv → evaluated →
// score_returned) one-for-one — see the migration comment on `assignments.status`.
const STATUS_ORDER = ["assigned", "in_progress", "for_psv", "evaluated", "score_returned"];

function stepsForStatus(status: string) {
  const at = STATUS_ORDER.indexOf(status);
  return ASSIGNMENT_STEPS.map((step, i) => ({ ...step, done: i <= at }));
}

export default function QacPersonnelAssignment({
  assignments,
}: {
  assignments: AssignmentRow[];
}) {
  const rows = assignments.map((a, i) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      college: a.college,
      program: a.program,
      level: a.level,
      accreditor: a.accreditor,
      score: <span className="italic text-gray">{a.score}</span>,
    },
    // The prototype leaves the second row expanded onto its progress track;
    // reproduced here as the last row, now driven by that row's real status.
    detail:
      i === assignments.length - 1 ? (
        <div className="px-[54px] pb-[22px] pt-[6px]">
          <Stepper steps={stepsForStatus(a.status)} />
        </div>
      ) : undefined,
  }));

  return (
    <div className="px-[57px] pb-[45px] pt-[45px]">
      <Card className="px-[44.5px] pb-[42px] pt-[47px]">
        <PanelHeader
          title="Accreditation Assignment"
          action={
            <Button variant="solid" icon={Plus} href="/portal/assignment/new">
              New
            </Button>
          }
        />
        <div className="mt-[26px]">
          {assignments.length > 0 ? (
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
            <EmptyState message="No assignments yet." />
          )}
        </div>
      </Card>
    </div>
  );
}
