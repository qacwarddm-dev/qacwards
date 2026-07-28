import { Check, EllipsisVertical, X } from "lucide-react";
import { IA_ASSIGNMENTS } from "../data";
import { type Column, DataTable, Panel } from "../kit";

/**
 * Internal Accreditor → Assignment —
 * assets/FIGMA/internal_accreditor/02-Accreditation.png.
 *
 * A single-panel table: the same grey-headed `DataTable` the QAC Personnel
 * Assignment screen uses, but with an accept/reject Action column and a Status
 * column instead of the accreditor/score pair. Outer padding 50/54/52 and the
 * 41px `Panel` shell are measured off the frame.
 */
const COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[175px]" },
  { key: "college", header: "College", width: "w-[150px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "action", header: "Action", width: "w-[130px]" },
  { key: "status", header: "Status", width: "w-[150px]" },
];

/** Small filled square holding a glyph — the accept (yellow) / reject (pink)
 *  affordance. The frame draws the reject square at half strength. */
function ActionSquare({ tone }: { tone: "accept" | "reject" }) {
  const accept = tone === "accept";
  return (
    <span
      className={`flex h-[24px] w-[24px] items-center justify-center rounded-[6px] ${
        accept ? "bg-yellow" : "bg-[color:var(--color-maroon)]/25"
      }`}
    >
      {accept ? (
        <Check className="h-[16px] w-[16px] text-white" strokeWidth={3} aria-hidden />
      ) : (
        <X className="h-[16px] w-[16px] text-white" strokeWidth={3} aria-hidden />
      )}
    </span>
  );
}

export default function InternalAccreditorAssignment() {
  const rows = IA_ASSIGNMENTS.map((a) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      college: a.college,
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      action: (
        <span className="flex items-center justify-center gap-[10px]">
          <ActionSquare tone="accept" />
          <ActionSquare tone="reject" />
        </span>
      ),
      status: (
        <span className="flex items-center justify-center gap-[16px]">
          <span className="italic text-gray">{a.status}</span>
          <EllipsisVertical
            className="h-[18px] w-[18px] text-black"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      ),
    },
  }));

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <Panel title="Accreditation Assignment">
        <DataTable columns={COLUMNS} rows={rows} />
      </Panel>
    </div>
  );
}
