"use client";

import { cycleResultLabel, cycleResultTone, type ArchiveCycle, type CycleContents } from "@/lib/archive-model";
import { shortDate } from "@/lib/program-names";
import BackLink from "./BackLink";
import Card, { CardHead } from "./Card";
import Crumbs from "./Crumbs";
import Empty from "./Empty";
import NoteBar from "./NoteBar";
import Pill from "./Pill";
import SumRows from "./SumRows";

export default function ArchiveCycleView({
  cycle,
  contents,
  own,
  onBack,
  onOpen,
}: {
  cycle: ArchiveCycle;
  contents: CycleContents;
  own?: boolean;
  onBack: () => void;
  onOpen: (programId: string) => void;
}) {
  const { programs } = contents;
  const finished = programs.filter((p) => p.result).length;
  const files = programs.reduce((n, p) => n + p.files.length, 0);

  return (
    <>
      <Crumbs items={[{ label: "Accreditation Archive", onClick: onBack }, { label: cycle.name }]} />
      <Card>
        <CardHead title={cycle.name} sub={`${cycle.closedAt ? `Closed ${shortDate(cycle.closedAt)}` : "Closed"}${cycle.closedBy ? ` by ${cycle.closedBy}` : ""} · read-only`} right={<BackLink to="Archive" onClick={onBack} />} />
        <SumRows
          four
          rows={[
            ["Cycle period", `${shortDate(cycle.start)} – ${shortDate(cycle.end)}`],
            [own ? "Your programs" : "Programs", programs.length],
            [own ? "Finished" : "Archived (finished)", finished],
            ["Files uploaded", files],
          ]}
        />
      </Card>
      <Card>
        <CardHead
          title={own ? "Your programs in this cycle" : "Programs in this cycle"}
          sub={own ? "Only the programs you handle are shown. Click a program to see all its files." : "Every program that took part, including those that did not finish. Click a program to see all its files."}
        />
        {programs.length ? (
          <div className="plx">
            {programs.map((p) => {
              const open = () => onOpen(p.id);
              return (
                <div key={p.id} className={own ? "prw cyp own" : "prw cyp"} role="button" tabIndex={0} onClick={open} onKeyDown={(k) => k.key === "Enter" && open()}>
                  <div>
                    <b>{p.program}</b>
                    <small>{own ? `${p.short} · ${p.campus}` : `${p.short} · ${p.college} · ${p.campus}`}</small>
                  </div>
                  <span>
                    {p.level}
                    <small>level</small>
                  </span>
                  <Pill tone={cycleResultTone(p)}>{cycleResultLabel(p)}</Pill>
                  <span>
                    <b>{p.files.length}</b>
                    <small>files</small>
                  </span>
                  {!own && <span className="lnk">View files</span>}
                  <span className="chev">›</span>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty compact>No program took part in this cycle.</Empty>
        )}
        {programs.some((p) => !p.result) && (
          <div style={{ marginTop: 10 }}>
            <NoteBar>
              Programs marked <b>Not finished</b> were still in progress when QAC closed the cycle. Their uploaded files are kept here as they were.
            </NoteBar>
          </div>
        )}
      </Card>
    </>
  );
}
