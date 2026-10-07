"use client";

import type { ArchiveCycle } from "@/lib/archive-model";
import { shortDate } from "@/lib/program-names";
import Pill from "./Pill";

export default function ArchiveCycles({ cycles, own, onPick }: { cycles: ArchiveCycle[]; own?: boolean; onPick: (id: string) => void }) {
  return (
    <div className="cyl">
      {cycles.map((c) => (
        <button key={c.id} type="button" className={own ? "cyr own" : "cyr"} onClick={() => onPick(c.id)}>
          <div>
            <b>{c.name}</b>
            <small>
              {shortDate(c.start)} – {shortDate(c.end)}
            </small>
          </div>
          <div>
            <span>{c.closedAt ? `Closed ${shortDate(c.closedAt)}` : "Closed"}</span>
            {c.closedBy && <small>{c.closedBy}</small>}
          </div>
          <div>
            <b>{c.programs}</b>
            <small>{own ? `your program${c.programs === 1 ? "" : "s"}` : "programs"}</small>
          </div>
          {!own && (
            <div>
              <b>{c.archived}</b>
              <small>archived</small>
            </div>
          )}
          <div>
            <b>{c.files}</b>
            <small>files</small>
          </div>
          <Pill tone="miss">Closed · read-only</Pill>
          <span className="chev">›</span>
        </button>
      ))}
    </div>
  );
}
