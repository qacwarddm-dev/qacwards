"use client";

import type { ArchiveCycle } from "@/lib/archive-model";
import { shortDate } from "@/lib/program-names";
import Pill from "./Pill";

export default function ArchiveCycles({ cycles, active, onPick }: { cycles: ArchiveCycle[]; active: string | null; onPick: (id: string | null) => void }) {
  return (
    <div className="plx arch-cyc">
      {cycles.map((c) => {
        const on = active === c.id;
        const pick = () => onPick(on ? null : c.id);
        return (
          <div key={c.id} className={`prw arch-crow${on ? " on" : ""}`} role="button" tabIndex={0} aria-pressed={on} onClick={pick} onKeyDown={(k) => k.key === "Enter" && pick()}>
            <div>
              <b>{c.name}</b>
              <small>
                {shortDate(c.start)} – {shortDate(c.end)}
              </small>
            </div>
            <span>
              {c.closedAt ? `Closed ${shortDate(c.closedAt)}` : "Closed"}
              <small>{c.closedBy ?? "—"}</small>
            </span>
            <span>
              <b>{c.programs}</b>
              <small>programs</small>
            </span>
            <span>
              <b>{c.archived}</b>
              <small>archived</small>
            </span>
            <Pill tone="miss">Closed · read-only</Pill>
          </div>
        );
      })}
    </div>
  );
}
