"use client";

import { useState } from "react";
import { LVS } from "@/lib/qac-model";
import { shortDate } from "@/lib/program-names";
import { PAGE, campusCounts, campusLabel, filterWatch, timeAgo, type Watch, type WatchTab } from "@/lib/validity-model";
import Btn from "./Btn";
import Card, { CardHead } from "./Card";
import Empty from "./Empty";
import Pill from "./Pill";
import SearchBox from "./SearchBox";

export type WatchPreset = { camp: string; lv: string };

export default function ValidityWatch({ watch, today, onGenerate }: { watch: Watch; today: string; onGenerate: (preset: WatchPreset) => void }) {
  const [tab, setTab] = useState<WatchTab>("soon");
  const [camp, setCamp] = useState("all");
  const [lv, setLv] = useState("all");
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);

  const base = tab === "soon" ? watch.soon : watch.expired;
  const campuses = campusCounts(base);
  const list = filterWatch(base, { camp, lv, q });
  const shown = all ? list : list.slice(0, PAGE);

  const pick = (t: WatchTab) => {
    const next = t === "soon" ? watch.soon : watch.expired;
    if (camp !== "all" && !next.some((r) => r.campus === camp)) setCamp("all");
    setTab(t);
    setAll(false);
  };

  return (
    <Card>
      <div className="vwatch">
        <CardHead title="Accreditation Validity Watch" sub={`Programs that need re-accreditation · as of ${shortDate(today)}`} right={<Btn onClick={() => onGenerate({ camp, lv })}>⬇ Generate report</Btn>} />
        <div className="vwatch-tiles">
          <button type="button" className={`vwatch-tile amb${tab === "soon" ? " on" : ""}`} aria-pressed={tab === "soon"} onClick={() => pick("soon")}>
            <b>{watch.soon.length}</b>
            <span>Expiring within 6 months</span>
            <small>Schedule the re-survey now</small>
          </button>
          <button type="button" className={`vwatch-tile red${tab === "exp" ? " on" : ""}`} aria-pressed={tab === "exp"} onClick={() => pick("exp")}>
            <b>{watch.expired.length}</b>
            <span>Already expired</span>
            <small>No valid accreditation</small>
          </button>
          <div className="vwatch-tile grn">
            <b>{watch.valid}</b>
            <span>Valid</span>
            <small>More than 6 months left</small>
          </div>
        </div>
        <div className="vwatch-tools">
          <SearchBox variant="r-sm" value={q} onChange={setQ} placeholder="Search program or campus" />
          <select className="inp" aria-label="Campus" value={camp} onChange={(e) => setCamp(e.target.value)}>
            <option value="all">All campuses</option>
            {campuses.map(([c, n]) => (
              <option key={c} value={c}>
                {campusLabel(c)} ({n})
              </option>
            ))}
          </select>
          <select className="inp" aria-label="Level" value={lv} onChange={(e) => setLv(e.target.value)}>
            <option value="all">All levels</option>
            {LVS.map((l) => (
              <option key={l[0]} value={l[0]}>
                {l[2]}
              </option>
            ))}
          </select>
        </div>
        {tab === "exp" && campuses.length > 0 && (
          <div className="vwatch-camps">
            <span>Most expired by campus:</span>
            {campuses.slice(0, 5).map(([c, n]) => (
              <button key={c} type="button" className={camp === c ? "on" : ""} onClick={() => setCamp(camp === c ? "all" : c)}>
                {campusLabel(c)} <b>{n}</b>
              </button>
            ))}
          </div>
        )}
        {list.length ? (
          <>
            <div className="tscroll">
              <table className="vwatch-t">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Campus</th>
                    <th>Level</th>
                    <th>Valid until</th>
                    <th>{tab === "soon" ? "Time left" : "Expired"}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td title={r.name}>
                        <b>{r.short}</b>
                      </td>
                      <td>{campusLabel(r.campus)}</td>
                      <td>{r.levelName}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{shortDate(r.to)}</td>
                      <td>
                        <Pill tone={r.days <= 60 ? "ret" : "pend"}>{r.days < 0 ? timeAgo(r.days) : `${r.days} days left`}</Pill>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <Btn variant={r.days < 0 ? "s" : "o"} sm href={`/portal/assignment?new=1&from=${r.id}`}>
                          {r.days < 0 ? "Start re-survey" : "Schedule re-survey"}
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="vwatch-foot">
              <span className="sub">
                Showing {shown.length} of {list.length}
                {list.length < base.length ? ` (filtered from ${base.length})` : ""}
              </span>
              {list.length > PAGE && (
                <a className="lnk" role="button" tabIndex={0} onClick={() => setAll(!all)} onKeyDown={(e) => e.key === "Enter" && setAll(!all)}>
                  {all ? "Show less" : `Show all ${list.length}`}
                </a>
              )}
            </div>
          </>
        ) : (
          <Empty>{base.length ? "No programs match your filters." : tab === "soon" ? "No accreditation expires in the next 6 months." : "No accreditation has expired."}</Empty>
        )}
      </div>
    </Card>
  );
}
