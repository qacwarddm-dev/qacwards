"use client";

import { Fragment, useState } from "react";
import { NodeIcon } from "./Icon";

export type TrackStep = { label: string; sub: string; state: "done" | "cur" | "" };

export type PhaseRow = {
  key: string;
  name: string;
  dim?: boolean;
  badges?: React.ReactNode;
  pct?: number;
  barColor?: string;
  lastModified?: string;
  status?: React.ReactNode;
  steps: TrackStep[];
  onOpen: () => void;
};

export function Tracker({ steps }: { steps: TrackStep[] }) {
  return (
    <div className="trk2">
      {steps.map((x, i) => (
        <Fragment key={x.label}>
          {i > 0 && <div className={`tln${x.state === "done" ? " done" : ""}`} />}
          <div className={`tst ${x.state}`}>
            <span className="dot">{x.state === "done" ? "✓" : ""}</span>
            <div>
              <b>{x.label}</b>
              <small>{x.sub}</small>
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export default function PhaseList({ rows, variant }: { rows: PhaseRow[]; variant?: "e" }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="pabox">
      {rows.map((r) => (
        <Fragment key={r.key}>
          <div
            className={`parow${variant ? ` ${variant}` : ""}${r.dim ? " dim" : ""}`}
            onClick={r.onOpen}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => e.key === "Enter" && r.onOpen()}
          >
            <button
              type="button"
              className={`pai${open === r.key ? " on" : ""}`}
              title="Show progress"
              aria-label={`Show progress of ${r.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(open === r.key ? null : r.key);
              }}
            >
              <NodeIcon />
            </button>
            <span className="pan">
              {r.name}
              {r.badges}
            </span>
            {variant === "e" ? (
              <>
                <span className="lm">Last modified: {r.lastModified ?? "—"}</span>
                <span>{r.status}</span>
              </>
            ) : (
              <>
                <div className="pabar">
                  <i style={{ width: `${r.pct ?? 0}%`, background: r.barColor }} />
                </div>
                <span className="pap">{r.pct ?? 0}%</span>
              </>
            )}
            <span className="pach">›</span>
          </div>
          {open === r.key && <Tracker steps={r.steps} />}
        </Fragment>
      ))}
    </div>
  );
}
