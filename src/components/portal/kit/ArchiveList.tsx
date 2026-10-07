"use client";

import { useMemo, useState } from "react";
import { NO_FILTERS, describeMean, entryYear, filterArchive, type ArchiveEntry, type ArchiveFilters } from "@/lib/archive-model";
import { LVS } from "@/lib/qac-model";
import { areaLabel } from "@/lib/program-names";
import Empty from "./Empty";
import Pill from "./Pill";
import SearchBox from "./SearchBox";

const sortKey = (e: ArchiveEntry) => e.visitDay ?? e.evaluatedAt ?? e.assignedAt;

export default function ArchiveList({
  entries,
  onOpen,
  filterable,
  areas,
}: {
  entries: ArchiveEntry[];
  onOpen: (id: string) => void;
  filterable?: boolean;
  areas?: string[];
}) {
  const [f, setF] = useState<ArchiveFilters>(NO_FILTERS);
  const set = (k: keyof ArchiveFilters) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const years = useMemo(() => [...new Set(entries.map(entryYear))].sort().reverse(), [entries]);
  const campuses = useMemo(() => [...new Set(entries.map((e) => e.campus))].sort(), [entries]);
  const list = useMemo(() => filterArchive(entries, f).sort((a, b) => sortKey(b).localeCompare(sortKey(a))), [entries, f]);

  const select = (label: string, key: keyof ArchiveFilters, opts: [string, string][]) => (
    <span className="arch-fpair">
      <label className="fl">{label}</label>
      <select className="inp" value={f[key]} onChange={(e) => set(key)(e.target.value)}>
        <option value="all">All</option>
        {opts.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </span>
  );

  return (
    <>
      {filterable && (
        <div className="ftools arch-filters">
          <SearchBox value={f.q} onChange={set("q")} placeholder="Search program, campus or finding" />
          {select("Year", "year", years.map((y) => [y, y]))}
          {select("Campus", "campus", campuses.map((c) => [c, c]))}
          {select("Level", "level", LVS.map((l) => [l[0], l[2]]))}
          {select("Result", "result", [["passed", "Passed"], ["deferred", "Deferred"]])}
          {select("Area", "area", (areas ?? []).map((a) => [a, a.split(" – ")[0]]))}
        </div>
      )}
      {list.length ? (
        <div className="plx">
          {list.map((e) => (
            <div key={e.id} className="prw arch-row" role="button" tabIndex={0} onClick={() => onOpen(e.id)} onKeyDown={(k) => k.key === "Enter" && onOpen(e.id)}>
              <div>
                <b>{e.program}</b>
                <small>
                  {e.college} · {e.campus}
                </small>
              </div>
              <span>
                {e.level}
                <small>{e.cycle}</small>
              </span>
              <span>
                {e.visit ?? "—"}
                <small>{e.accreditors.map((n) => n.split(",")[0]).join(" · ") || "—"}</small>
              </span>
              <span>
                <b>{e.grandMean === null ? "—" : e.grandMean.toFixed(2)}</b>
                {e.grandMean !== null && <small>{describeMean(e.grandMean)}</small>}
              </span>
              <Pill tone={e.passed ? "ok" : "ret"}>{e.passed ? "Passed" : "Deferred"}</Pill>
              <span>
                <b>{e.issues.length}</b>
                <small>issues resolved</small>
              </span>
              <span className="chev">›</span>
            </div>
          ))}
        </div>
      ) : (
        <Empty>
          {entries.length ? "No archived accreditations match your filters." : "No finished accreditations yet. They appear here once QAC records the result of a survey visit."}
        </Empty>
      )}
    </>
  );
}

export const archiveAreas = (entries: ArchiveEntry[]) => [...new Set(entries.flatMap((e) => e.issues.map((i) => i.area)))].sort().map(areaLabel);
