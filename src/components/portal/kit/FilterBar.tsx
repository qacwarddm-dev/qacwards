"use client";

import SearchField from "./SearchField";
import { SelectInput } from "./Field";

export type FilterSpec = {
  label: string;
  options: string[];
  onSelect?: (value: string) => void;
};

/**
 * Search box + one or more labelled dropdowns, with an optional action on the
 * far right — the row above Reports' "Report Generation" table and QAC's
 * "Feedbacks" list (assets/new frames/EVENTS/Reports.png and .../Feedbacks
 * duplicate). Both frames draw the same shape (search, then each filter's
 * label beside its own "All" menu), so this is one component rather than two
 * near-identical toolbars.
 */
export default function FilterBar({
  search,
  filters = [],
  action,
}: {
  search?: { value: string; onChange: (value: string) => void; label?: string };
  filters?: FilterSpec[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[16px]">
      {search && (
        <SearchField
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          label={search.label ?? "Search"}
          className="w-[260px]"
        />
      )}

      {filters.map((f) => (
        <span key={f.label} className="flex items-center gap-[10px]">
          <span className="text-regular font-semibold leading-none text-maroon">{f.label}</span>
          <span className="w-[110px]">
            <SelectInput label={f.label} options={f.options} onSelect={f.onSelect} />
          </span>
        </span>
      ))}

      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}
