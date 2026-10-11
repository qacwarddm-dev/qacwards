"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Btn from "./Btn";
import Card from "./Card";
import Modal from "./Modal";

export type ProgressStageView = {
  title: string;
  hint: string;
  summary: string;
  fraction: number;
  detail: React.ReactNode;
  action?: { label: string; href: string };
};

export type ProgressChip = { label: string; caption: string; tone: "red" | "amber"; href?: string };

export type ProgressAttention = {
  redCount: number;
  redLabel: string;
  redNote: string;
  amberCount: number;
  amberLabel: string;
  amberNote: string;
  chips: ProgressChip[];
};

const share = (fraction: number) => +(fraction * 25).toFixed(1);

export default function AccreditationProgress({
  title,
  sub,
  percent,
  stages,
  attention,
  note,
  program,
}: {
  title: string;
  sub: React.ReactNode;
  percent: number;
  stages: ProgressStageView[];
  attention?: ProgressAttention;
  note: string;
  /** Shown under the stage title in the detail dialog. */
  program: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const first = stages.findIndex((s) => s.fraction < 1);
  const current = first < 0 ? stages.length : first;
  const stage = open === null ? null : stages[open];

  return (
    <Card>
      <div className="ptk">
        <div className="ch">
          <div>
            <h2>{title}</h2>
            <div className="sub">{sub}</div>
          </div>
          <div className="ptk-big">
            <b>{percent}%</b>
            <small>{current < stages.length ? `Now: ${stages[current].title}` : "Completed"}</small>
          </div>
        </div>
        <div className="ptk-bar">
          {stages.map((s, i) => (
            <i key={i} style={{ "--f": `${Math.round(s.fraction * 100)}%` } as React.CSSProperties} className={s.fraction >= 1 ? "done" : undefined} />
          ))}
        </div>
        <div className="ptk-steps">
          {stages.map((s, i) => {
            const state = s.fraction >= 1 ? "done" : i === current ? "now" : "wait";
            return (
              <button key={i} type="button" className={`pts ${state}`} title={s.hint} onClick={() => setOpen(i)}>
                <i>{s.fraction >= 1 ? "✓" : i + 1}</i>
                <b>{s.title}</b>
                <small>{s.summary}</small>
                <em>{share(s.fraction)}% of 25%</em>
              </button>
            );
          })}
        </div>
        {attention && (
          <div className="ptk-miss">
            <div>
              <b style={{ color: "var(--red)" }}>
                ● {attention.redCount} {attention.redLabel}
              </b>{" "}
              <span className="sub">{attention.redNote}</span>
              {attention.amberCount > 0 && (
                <>
                  {" "}
                  <b style={{ color: "#8a6d00", marginLeft: 10 }}>
                    ● {attention.amberCount} {attention.amberLabel}
                  </b>{" "}
                  <span className="sub">{attention.amberNote}</span>
                </>
              )}
            </div>
            <div className="ptk-chips">
              {attention.chips.map((c) => (
                <span
                  key={c.label}
                  role="button"
                  tabIndex={0}
                  className={`ptc ${c.tone === "amber" ? "amb" : "red"}`}
                  onClick={() => (c.href ? router.push(c.href) : setOpen(1))}
                  onKeyDown={(e) => e.key === "Enter" && (c.href ? router.push(c.href) : setOpen(1))}
                >
                  {c.label}
                  <small>{c.caption}</small>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="sub" style={{ fontSize: 11.5, marginTop: 10 }}>
          ℹ {note}
        </div>
      </div>

      {stage && open !== null && (
        <Modal
          size="wide"
          onClose={() => setOpen(null)}
          title={`Stage ${open + 1} · ${stage.title}`}
          sub={`${program} · ${share(stage.fraction)}% of 25%`}
          footer={
            <>
              {stage.action && (
                <Btn variant="o" href={stage.action.href}>
                  {stage.action.label}
                </Btn>
              )}
              <Btn onClick={() => setOpen(null)}>Close</Btn>
            </>
          }
        >
          {stage.detail}
        </Modal>
      )}
    </Card>
  );
}
