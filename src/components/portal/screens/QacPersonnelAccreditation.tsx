"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { AccreditationOverview } from "@/lib/assignments";
import { Button, EvaluationSummary, FilterBar, Panel, ProgressRow, RowList } from "../kit";

/**
 * QAC Personnel → Accreditation (docs/qac_per.pdf, "ACCREDITATION"): the
 * PSV–Level IV summary, then every programme under accreditation, filtered by
 * campus and level and searched by name. A row opens that programme's
 * Requirements; "New" opens the Accreditation Assignment form.
 */
export default function QacPersonnelAccreditation({ data }: { data: AccreditationOverview }) {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("All");
  const [level, setLevel] = useState("All");

  const query = search.trim().toLowerCase();
  const rows = data.programs.filter(
    (p) =>
      (campus === "All" || p.campus === campus) &&
      (level === "All" || p.level === level) &&
      (!query || p.program.toLowerCase().includes(query)),
  );

  return (
    <div className="px-[var(--page-gutter)] pb-[50px] pt-[50px] lg:pl-[54px] lg:pr-[52px]">
      <EvaluationSummary title="Accreditation Summary" stats={data.summary} />

      <p className="mb-[14px] mt-[26px] text-regular text-gray">Programs</p>

      <Panel
        title="Programs"
        toolbar={
          <FilterBar
            align="end"
            search={{ value: search, onChange: setSearch, label: "Search programs" }}
            filters={[
              { label: "Campus", options: ["All", ...data.campuses], onSelect: setCampus },
              { label: "Level", options: ["All", ...data.levels], onSelect: setLevel },
            ]}
            action={
              <Button variant="solid" icon={Plus} href="/portal/assignment/new">
                New
              </Button>
            }
          />
        }
      >
        {rows.length > 0 ? (
          <RowList>
            {rows.map((p) => (
              <ProgressRow
                key={p.id}
                label={p.program}
                marker={false}
                density="compact"
                meta={[p.campus, p.level, `IA: ${p.accreditor}`]}
                percent={p.readiness}
                href={`/portal/assignment/${p.id}`}
              />
            ))}
          </RowList>
        ) : (
          <p className="px-[4px] py-[10px] text-regular text-gray">
            {data.programs.length > 0
              ? "No programs match these filters."
              : "No programs under accreditation yet. Start one with New."}
          </p>
        )}
      </Panel>
    </div>
  );
}
