"use client";

import { useState } from "react";
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
 *
 * docs/qac_per.pdf: the list is generated from expertise, so only eligible
 * accreditors (a qualifying area, `getEligibleAccreditors`) show by default.
 * Everyone else — including the QAC Personnel fallback — is one "Show all"
 * away, and a picked row stays visible even after the list is collapsed.
 */
const COLUMNS: Column[] = [
  { key: "name", header: "Name", width: "w-[248px]" },
  { key: "expertise", header: "Expertise", width: "min-w-0 flex-1" },
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
  const [showAll, setShowAll] = useState(false);

  if (accreditors.length === 0) {
    return <p className="py-[20px] text-regular text-gray">{emptyMessage}</p>;
  }

  const isEligible = (a: EligibleAccreditor) => a.matched.length > 0 && !a.isQacStaff;
  const eligibleCount = accreditors.filter(isEligible).length;
  const others = accreditors.length - eligibleCount;
  const visible = showAll
    ? accreditors
    : accreditors.filter((a) => isEligible(a) || selected.has(a.id));

  const rows = visible.map((a) => ({
    id: a.id,
    cells: {
      name: (
        <span className="text-gray">
          {a.name}
          {a.isQacStaff && <span className="ml-[8px] italic text-gray">(QAC Personnel)</span>}
        </span>
      ),
      expertise: (
        // contain: an intrinsic width of zero, so a long list truncates in its
        // column instead of widening the table past its clipped border.
        <span className="block truncate text-gray [contain:inline-size]" title={a.expertise.join(", ")}>
          {a.expertise.length > 0 ? a.expertise.join(", ") : "No expertise on file"}
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

  return (
    <>
      {visible.length > 0 ? (
        <DataTable columns={COLUMNS} rows={rows} bodyRowH="h-[47px]" variant="outlined" />
      ) : (
        <p className="py-[20px] text-regular text-gray">
          No accreditor&apos;s expertise matches this program.
        </p>
      )}
      {others > 0 && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-[12px] text-regular font-semibold leading-none text-maroon hover:underline"
        >
          {showAll ? "Show eligible only" : `Show all accreditors (${others} more)`}
        </button>
      )}
    </>
  );
}
