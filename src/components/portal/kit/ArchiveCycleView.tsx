"use client";

import { useState } from "react";
import type { ArchiveCycle, CycleActivity, CycleActivityKind, CycleContents, CycleDoc, CycleProgram } from "@/lib/archive-model";
import { manilaTime, shortDate } from "@/lib/program-names";
import BackLink from "./BackLink";
import Btn from "./Btn";
import Card, { CardHead } from "./Card";
import Empty from "./Empty";
import Pill, { DocPill } from "./Pill";
import StatTile, { StatGrid } from "./StatTile";

const ICON: Record<CycleActivityKind, [string, string]> = {
  submission: ["📥", "var(--gold-soft)"],
  document: ["📄", "var(--gold-soft)"],
  review: ["✔", "var(--green-soft)"],
  assignment: ["👥", "var(--blue-soft)"],
  visit: ["🗓", "var(--blue-soft)"],
  result: ["🏁", "var(--green-soft)"],
  event: ["🗓", "var(--bg)"],
};

const PAGE = 25;

function Docs({ p, onView, onRecord }: { p: CycleProgram; onView: (d: CycleDoc, p: CycleProgram) => void; onRecord: (id: string) => void }) {
  return (
    <div className="acy-docs">
      {p.docs.length ? (
        <div className="tscroll">
          <table className="arch-tb">
            <thead>
              <tr>
                <th>Area</th>
                <th>Document</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.area}</td>
                  <td>
                    <span className="pdfi">PDF</span> {d.title}
                    {d.version > 1 && <small>Version {d.version}</small>}
                  </td>
                  <td>
                    {shortDate(d.uploadedAt)}
                    <small>{d.by}</small>
                  </td>
                  <td>
                    <DocPill state={d.state} />
                    {d.note && <small>{d.note}</small>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Btn variant="gh" sm onClick={() => onView(d, p)}>
                      View
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sub">No documents were uploaded for this submission.</div>
      )}
      <div className="acy-meta">
        <span>Survey visit: {p.visit ? shortDate(p.visit) : "Not scheduled"}</span>
        <span>Accreditors: {p.accreditors.join(" · ") || "None assigned"}</span>
        {p.archiveId && (
          <Btn variant="o" sm onClick={() => onRecord(p.archiveId!)}>
            Open accreditation record
          </Btn>
        )}
      </div>
    </div>
  );
}

function Feed({ items, own }: { items: CycleActivity[]; own?: boolean }) {
  const [shown, setShown] = useState(PAGE);
  if (!items.length) return <Empty compact>Nothing was recorded in this cycle.</Empty>;
  return (
    <>
      <div className="acy-feed">
        {items.slice(0, shown).map((a) => {
          const [ic, bg] = ICON[a.kind];
          return (
            <div key={a.id} className="acy-ev">
              <i style={{ background: bg }}>{ic}</i>
              <div>
                <b>
                  {a.program && !own ? `${a.program} · ` : ""}
                  {a.text}
                </b>
                {a.note && <small>{a.note}</small>}
              </div>
              <span>
                {shortDate(a.at)}
                <small>{a.kind === "visit" ? "" : manilaTime(a.at)}</small>
              </span>
            </div>
          );
        })}
      </div>
      {shown < items.length && (
        <div className="acy-more">
          <Btn variant="gh" sm onClick={() => setShown((n) => n + PAGE)}>
            Show more ({items.length - shown})
          </Btn>
        </div>
      )}
    </>
  );
}

export default function ArchiveCycleView({
  cycle,
  contents,
  own,
  onBack,
  onRecord,
  onView,
}: {
  cycle: ArchiveCycle;
  contents: CycleContents;
  own?: boolean;
  onBack: () => void;
  onRecord: (id: string) => void;
  onView: (d: CycleDoc, p: CycleProgram) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const { programs, activity, documents, events } = contents;
  const passed = programs.filter((p) => p.result === "passed").length;
  const deferred = programs.filter((p) => p.result === "deferred").length;

  return (
    <>
      <Card>
        <CardHead
          title={cycle.name}
          sub={`${shortDate(cycle.start)} – ${shortDate(cycle.end)} · ${cycle.closedAt ? `Closed ${shortDate(cycle.closedAt)}` : "Closed"}${cycle.closedBy ? ` by ${cycle.closedBy}` : ""} · read-only history`}
          right={<BackLink to="Closed cycles" onClick={onBack} />}
        />
        <StatGrid>
          <StatTile flat label="Programs" value={programs.length} sub={own ? "of yours in this cycle" : "filed in this cycle"} />
          <StatTile flat label="Documents submitted" value={documents} sub="current versions" />
          <StatTile flat label="Results" value={passed + deferred} sub={`${passed} passed · ${deferred} deferred`} />
          <StatTile flat label="Events" value={events} sub="scheduled in this cycle" />
        </StatGrid>
      </Card>

      <Card>
        <CardHead title="What was submitted" sub="Select a program to see the documents it submitted and how each one was reviewed." />
        {programs.length ? (
          <div className="plx">
            {programs.map((p) => {
              const on = open === p.id;
              const toggle = () => setOpen(on ? null : p.id);
              return (
                <div key={p.id} className={`acy-p${on ? " on" : ""}`}>
                  <div className="prw acy-row" role="button" tabIndex={0} aria-expanded={on} onClick={toggle} onKeyDown={(k) => k.key === "Enter" && toggle()}>
                    <div>
                      <b>{p.program}</b>
                      <small>
                        {p.college} · {p.campus}
                      </small>
                    </div>
                    <span>
                      {p.level}
                      <small>Attempt {p.attempt}</small>
                    </span>
                    <span>
                      {p.submittedAt ? shortDate(p.submittedAt) : "Not filed"}
                      <small>{p.status}</small>
                    </span>
                    <span>
                      <b>{p.docs.length}</b>
                      <small>documents</small>
                    </span>
                    {p.result ? <Pill tone={p.result === "passed" ? "ok" : "ret"}>{p.result === "passed" ? "Passed" : "Deferred"}</Pill> : <Pill tone="miss">No result</Pill>}
                  </div>
                  {on && <Docs p={p} onView={onView} onRecord={onRecord} />}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty compact>No program filed a submission in this cycle.</Empty>
        )}
      </Card>

      <Card>
        <CardHead title="What happened in this cycle" sub="Filings, uploads, reviews, assignments, survey visits, results and events, newest first." />
        <Feed items={activity} own={own} />
      </Card>
    </>
  );
}
