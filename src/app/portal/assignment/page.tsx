import { GitCommitHorizontal, Plus } from "lucide-react";
import { ASSIGNMENT_STEPS, ASSIGNMENTS } from "@/components/portal/data";
import {
  Button,
  Card,
  type Column,
  DataTable,
  PanelHeader,
  Stepper,
} from "@/components/portal/kit";

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

export default function AssignmentPage() {
  const rows = ASSIGNMENTS.map((a, i) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      college: a.college,
      program: a.program,
      level: a.level,
      accreditor: a.accreditor,
      score: <span className="italic text-gray">{a.score}</span>,
    },
    // The prototype leaves the second row expanded onto its progress track.
    detail:
      i === ASSIGNMENTS.length - 1 ? (
        <div className="px-[54px] pb-[22px] pt-[6px]">
          <Stepper steps={ASSIGNMENT_STEPS} />
        </div>
      ) : undefined,
  }));

  return (
    <div className="px-[57px] pt-[45px] pb-[45px]">
      <Card className="px-[44.5px] pb-[42px] pt-[47px]">
        <PanelHeader
          title="Accreditation Assignment"
          action={
            <Button variant="solid" icon={Plus}>
              New
            </Button>
          }
        />
        <div className="mt-[26px]">
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
        </div>
      </Card>
    </div>
  );
}
