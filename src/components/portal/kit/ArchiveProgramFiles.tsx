"use client";

import { useState } from "react";
import { CYCLE_GROUPS, cycleResultLabel, cycleResultTone, type ArchiveCycle, type CycleFile, type CycleFileGroup, type CycleFileState, type CycleProgram } from "@/lib/archive-model";
import { fileSize, shortDate } from "@/lib/program-names";
import BackLink from "./BackLink";
import Btn from "./Btn";
import Card, { CardHead } from "./Card";
import Crumbs from "./Crumbs";
import Empty from "./Empty";
import FileViewModal from "./FileViewModal";
import NoteBar from "./NoteBar";
import Pill, { type PillTone } from "./Pill";
import SearchBox from "./SearchBox";
import useContentMatches from "./useContentMatches";
import SumRows from "./SumRows";

const STATE: Record<CycleFileState, [string, PillTone]> = {
  accepted: ["Accepted", "ok"],
  returned: ["Returned", "ret"],
  pending: ["Not reviewed · cycle closed", "miss"],
  acknowledged: ["Acknowledged by QAC", "ok"],
  recorded: ["Recorded", "ok"],
};

const download = (f: CycleFile) => `/api/documents/download?source=${f.source}&id=${f.id}`;

export default function ArchiveProgramFiles({
  cycle,
  program: p,
  own,
  viewer,
  onRoot,
  onBack,
  onRecord,
}: {
  cycle: ArchiveCycle;
  program: CycleProgram;
  own?: boolean;
  viewer: string;
  onRoot: () => void;
  onBack: () => void;
  onRecord: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const text = useContentMatches(["submission", "repository"], q);
  const [group, setGroup] = useState<"all" | CycleFileGroup>("all");
  const [view, setView] = useState<{ title: string; src: string; sub: string } | null>(null);
  const ay = cycle.name.replace(/ Accreditation Cycle$/, "");
  const term = q.trim().toLowerCase();
  const list = p.files.filter((f) => (group === "all" || f.group === group) && (!term || text.ids.has(f.id) || `${f.name} ${f.sub}`.toLowerCase().includes(term)));
  const zippable = p.files.some((f) => f.source !== "report");

  const note = p.movedTo
    ? `Still in progress when QAC closed the cycle. The program carried on in ${p.movedTo}; the files it had uploaded by then are kept here as they were.`
    : "Still in progress when QAC closed the cycle. Its uploaded files are kept here as they were.";

  return (
    <>
      <Crumbs items={[{ label: "Accreditation Archive", onClick: onRoot }, { label: cycle.name, onClick: onBack }, { label: p.short }]} />
      <Card>
        <CardHead title={p.program} sub={`${own ? "" : `${p.collegeName} · `}${p.campus} · ${p.level} · ${ay}`} right={<BackLink to={ay} onClick={onBack} />} />
        <SumRows
          four
          rows={[
            ["Result", <b key="r"><Pill tone={cycleResultTone(p)}>{cycleResultLabel(p)}</Pill></b>],
            ["Internal accreditors", p.accreditors.join(" · ") || "—"],
            ["Files", p.files.length],
            ["Access", "View only · cycle closed"],
          ]}
        />
        {!p.result && (
          <div style={{ marginTop: 12 }}>
            <NoteBar>{note}</NoteBar>
          </div>
        )}
        <div className="cy-act">
          {!own && p.archiveId && (
            <Btn variant="o" sm onClick={() => onRecord(p.archiveId!)}>
              Open archive record ›
            </Btn>
          )}
          {zippable && (
            <Btn variant="s" sm href={`/api/archive/zip?cycle=${cycle.id}&program=${p.id}`} download>
              ⬇ Download all files
            </Btn>
          )}
        </div>
      </Card>

      <Card>
        <div className="ftools cy-tools">
          <SearchBox value={q} onChange={setQ} placeholder="Search files" />
          <label className="fl">Show</label>
          <select className="inp" aria-label="Show" value={group} onChange={(e) => setGroup(e.target.value as "all" | CycleFileGroup)}>
            <option value="all">All files</option>
            {(Object.entries(CYCLE_GROUPS) as [CycleFileGroup, string][]).map(([k, t]) => (
              <option key={k} value={k}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {list.length ? (
          (Object.keys(CYCLE_GROUPS) as CycleFileGroup[])
            .filter((k) => list.some((f) => f.group === k))
            .map((k) => {
              const inGroup = list.filter((f) => f.group === k);
              const subs = [...new Set(inGroup.map((f) => f.sub))];
              return (
                <div key={k}>
                  <h3 className="h3s cy-h">
                    {CYCLE_GROUPS[k]} <small>{inGroup.length} file{inGroup.length > 1 ? "s" : ""}</small>
                  </h3>
                  {subs.map((sub) => {
                    const files = inGroup.filter((f) => f.sub === sub);
                    return (
                      <details key={sub} className={k === "ev" ? "cy-g flat" : "cy-g"} open={k === "ev" || Boolean(term) || subs.length <= 3}>
                        <summary>
                          <b>{sub}</b>
                          <small>
                            {files.length} file{files.length > 1 ? "s" : ""}
                          </small>
                        </summary>
                        {files.map((f) => {
                          const [label, tone] = STATE[f.state];
                          const meta = [f.source === "report" ? null : `v${f.version}`, f.by, f.at ? shortDate(f.at) : null, f.source === "report" ? null : fileSize(f.size)].filter(Boolean).join(" · ");
                          return (
                            <div key={f.id} className="cy-file">
                              <span className="pdfi">PDF</span>
                              <div>
                                <b>{f.name}</b>
                                <small>
                                  {meta}
                                  {f.returnedV1 && (
                                    <>
                                      {" · "}
                                      <a className="lnk" role="button" tabIndex={0} onClick={() => setView({ title: `${f.name} (v1)`, src: `/api/documents/download?source=submission&id=${f.returnedV1!.id}`, sub: `v1 · returned: ${f.returnedV1!.note}` })}>
                                        see v1 (returned)
                                      </a>
                                    </>
                                  )}
                                </small>
                                {f.state === "returned" && f.note && <small>Returned: {f.note}</small>}
                              </div>
                              <Pill tone={tone}>{label}</Pill>
                              {f.source === "report" ? (
                                p.archiveId && !own && (
                                  <Btn variant="gh" sm onClick={() => onRecord(p.archiveId!)}>
                                    Record
                                  </Btn>
                                )
                              ) : (
                                <Btn variant="gh" sm onClick={() => setView({ title: f.name, src: download(f), sub: `${p.short} · ${cycle.name} · view only` })}>
                                  View
                                </Btn>
                              )}
                            </div>
                          );
                        })}
                      </details>
                    );
                  })}
                </div>
              );
            })
        ) : (
          <Empty>{p.files.length ? (text.pending ? "Searching inside files…" : "No files match your search.") : "No files were uploaded for this program in this cycle."}</Empty>
        )}
      </Card>
      {view && <FileViewModal title={view.title} sub={view.sub} src={view.src} viewer={viewer} own={own} onClose={() => setView(null)} />}
    </>
  );
}
