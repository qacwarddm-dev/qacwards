"use client";

import { useMemo, useState } from "react";
import useNav from "../../kit/nav";
import AccreditorChips from "../../kit/AccreditorChips";
import { RBar } from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import Empty from "../../kit/Empty";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import SearchBox from "../../kit/SearchBox";
import SegTabs from "../../kit/SegTabs";
import SumRows from "../../kit/SumRows";
import { LVS, daysTo, qacStatus, readiness, type QacProgram } from "@/lib/qac-model";
import { shortDate } from "@/lib/program-names";

type Tab = "proc" | "acc" | "all";

export default function QacAccreditation({ programs, today, monthLabel }: { programs: QacProgram[]; today: string; monthLabel: string }) {
  const router = useNav();
  const [tab, setTab] = useState<Tab>("proc");
  const [lv, setLv] = useState("all");
  const [camp, setCamp] = useState("all");
  const [q, setQ] = useState("");
  const [acc, setAcc] = useState<QacProgram | null>(null);
  const inp = programs.filter((p) => p.inproc);
  const done = programs.filter((p) => !p.inproc);
  const campuses = [...new Set(programs.map((p) => p.campus))];
  const list = useMemo(
    () =>
      programs.filter(
        (p) =>
          (tab === "all" || (tab === "proc") === p.inproc) &&
          (lv === "all" || p.levelCode === lv) &&
          (camp === "all" || p.campus === camp) &&
          (!q || `${p.name} ${p.short} ${p.team.map((m) => m.name).join(" ")}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [programs, tab, lv, camp, q],
  );

  return (
    <>
      <Card>
        <CardHead
          title="Accreditation Summary"
          sub={`As of ${monthLabel} · click a level to filter`}
          right={
            lv !== "all" ? (
              <a className="lnk" role="button" onClick={() => setLv("all")}>
                Show all levels ✕
              </a>
            ) : null
          }
        />
        <div className="lsum">
          {LVS.map(([k, s]) => (
            <div key={k} className={`lsc${lv === k ? " on" : ""}`} onClick={() => setLv(lv === k ? "all" : k)} role="button">
              <h5>{s}</h5>
              <b>{inp.filter((p) => p.levelCode === k).length}</b>
              <span>in process</span>
              <small>{done.filter((p) => p.levelCode === k).length} accredited</small>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="ch">
          <SegTabs
            flush
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "proc", label: "In process", count: inp.length || undefined },
              { key: "acc", label: "Accredited", count: done.length || undefined },
              { key: "all", label: "All", count: programs.length || undefined },
            ]}
          />
          <div className="ftools">
            <SearchBox value={q} onChange={setQ} placeholder="Search program or accreditor" />
            <label className="fl">Campus</label>
            <select className="inp" value={camp} onChange={(e) => setCamp(e.target.value)}>
              <option value="all">All</option>
              {campuses.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <label className="fl">Level</label>
            <select className="inp" value={lv} onChange={(e) => setLv(e.target.value)}>
              <option value="all">All</option>
              {LVS.map((l) => (
                <option key={l[0]} value={l[0]}>
                  {l[2]}
                </option>
              ))}
            </select>
            <Btn href="/portal/assignment?new=1">＋ New assignment</Btn>
          </div>
        </div>
        {list.length ? (
          <div className="plx">
            {list.map((p) => {
              const s = qacStatus(p, today);
              const d = daysTo(p.to, today);
              const r = readiness(p);
              return (
                <div key={p.id} className="prw" role="link" onClick={() => (p.inproc ? router.push(`/portal/assignment?id=${p.id}`) : setAcc(p))}>
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.college} · {p.campus}
                    </small>
                  </div>
                  <span>{p.levelName}</span>
                  <div>
                    {p.inproc ? (
                      <AccreditorChips team={p.team} />
                    ) : (
                      <small className="vd">
                        Valid until <b>{p.to ? shortDate(p.to) : "—"}</b>
                      </small>
                    )}
                  </div>
                  {p.inproc ? (
                    <RBar pct={r} />
                  ) : (
                    <RBar
                      pct={p.to ? Math.max(0, Math.min(100, 100 - d / 10)) : 100}
                      color={d < 0 ? "var(--red)" : d <= 183 ? "var(--gold)" : "var(--green)"}
                      label={<span style={{ fontSize: 11 }}>{!p.to ? "—" : d < 0 ? "expired" : `${d}d`}</span>}
                    />
                  )}
                  <Pill tone={s.c}>{s.t}</Pill>
                  <span className="chev">›</span>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty>No programs match your filters.</Empty>
        )}
      </Card>
      {acc && <AccreditedModal p={acc} today={today} onClose={() => setAcc(null)} />}
    </>
  );
}

function AccreditedModal({ p, today, onClose }: { p: QacProgram; today: string; onClose: () => void }) {
  const d = daysTo(p.to, today);
  const s = qacStatus(p, today);
  const soon = p.to && d <= 183;
  return (
    <Modal
      title={p.name}
      sub={`${p.collegeName} · ${p.campus}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" href={`/portal/aaccup-copc?loc=${p.isMain ? "main" : "camp"}&unit=${encodeURIComponent(p.isMain ? p.college : p.campus)}&type=cert`}>
            📁 View certificate
          </Btn>
          {soon ? <Btn href={`/portal/assignment?new=1&from=${p.id}`}>Start re-survey ›</Btn> : <Btn onClick={onClose}>Close</Btn>}
        </>
      }
    >
      <SumRows
        rows={[
          ["Level", p.levelName],
          ["Status", <b key="s"><Pill tone={s.c}>{s.t}</Pill></b>],
          ["Valid from", p.from ? shortDate(p.from) : "—"],
          ["Valid until", p.to ? `${shortDate(p.to)} · ${d < 0 ? `${-d} days ago` : `${d} days left`}` : "—"],
          ["COPC", p.copc ? "✅ With COPC" : "—"],
        ]}
      />
      {soon && (
        <div className="lockb" style={{ marginTop: 12, background: d < 0 ? "#fdecec" : "#fff6d6" }}>
          {d < 0 ? "⛔" : "⚠"}{" "}
          <div>
            {d < 0 ? (
              <>
                This accreditation has <b>expired</b>. Start a re-survey so the program keeps its status.
              </>
            ) : (
              <>
                This accreditation <b>expires within 6 months</b>. Start the re-survey now.
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
