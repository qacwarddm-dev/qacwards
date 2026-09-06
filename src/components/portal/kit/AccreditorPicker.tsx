"use client";

import type { EligibleAccreditor } from "@/lib/assignments";
import Button from "./Button";
import DataTable, { type Column } from "./DataTable";

/**
 * The ranked eligible-accreditor table with a per-row select toggle —
 * assets/FIGMA/qac_personnel/03.1-Create new assignment.png.
 *
 * Lives in the kit because round 2 gave it a second call site: QAC Personnel
 * builds a team here when creating an assignment, and picks a replacement team
 * here again when one is declined. Ranking, badging and the "no matching
 * expertise" wording are the component's, so the two screens cannot drift on
 * what a QAC-staff fallback looks like.
 */
const COLUMNS: Column[] = [
  { key: "name", header: "Name", width: "w-[248px]" },
  { key: "expertise", header: "Expertise", width: "flex-1" },
  { key: "action", header: "Action", width: "w-[200px]" },
];

export default function AccreditorPicker({
  accreditors,
  selected,
  onToggle,
  disabled = false,
  emptyMessage = "No active accreditors on file yet.",
}: {
  accreditors: EligibleAccreditor[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  if (accreditors.length === 0) {
    return <p className="py-[20px] text-regular text-gray">{emptyMessage}</p>;
  }

  const rows = accreditors.map((a) => ({
    id: a.id,
    cells: {
      name: (
        <span className="text-gray">
          {a.name}
          {a.isQacStaff && <span className="ml-[8px] italic text-gray">(QAC Personnel)</span>}
        </span>
      ),
      expertise: (
        <span className="text-gray">
          {a.matched.length > 0 ? a.matched.join(", ") : "No matching expertise on file"}
        </span>
      ),
      action: (
        <span className="flex justify-center">
          <Button
            variant={selected.has(a.id) ? "solid" : "outline"}
            disabled={disabled}
            onClick={() => onToggle(a.id)}
          >
            {selected.has(a.id) ? "Selected" : "Assign"}
          </Button>
        </span>
      ),
    },
  }));

  return <DataTable columns={COLUMNS} rows={rows} bodyRowH="h-[47px]" />;
}
