"use client";

import RoleChip, { roleLabel } from "../kit/RoleChip";
import { useState } from "react";
import Btn from "../kit/Btn";
import Empty from "../kit/Empty";
import FilterPills from "../kit/FilterPills";
import Modal from "../kit/Modal";
import SearchBox from "../kit/SearchBox";
import SumRows from "../kit/SumRows";
import Toggle from "../kit/Toggle";
import { useToast } from "../kit/ToastProvider";
import { csv, manilaParts } from "./MyActivity";
import type { ActivityCat, MyActivityEntry } from "@/lib/activity";

const ACAT: Record<string, [string, string, string]> = {
  sub: ["Submissions", "⬆", "#fdecec"],
  rev: ["Reviews", "✓", "#e9f7ec"],
  asg: ["Assignments", "👥", "#e8eefb"],
  agr: ["Agreements", "✍", "#eef0fb"],
  acct: ["Accounts", "👤", "#f3f3f3"],
  ev: ["Events", "🗓", "#e8eefb"],
  set: ["Settings", "⚙", "#fff6d6"],
  sys: ["System", "🖥", "#f3f3f3"],
};

const kind = (c: ActivityCat) => (c === "eval" ? "rev" : c === "file" || c === "rep" ? "set" : c);

export default function SystemActivity({ entries, today }: { entries: MyActivityEntry[]; today: string }) {
  const [c, setC] = useState("all");
  const [q, setQ] = useState("");
  const [u, setU] = useState("all");
  const [d, setD] = useState("all");
  const [test, setTest] = useState(false);
  const [n, setN] = useState(12);
  const [view, setView] = useState<MyActivityEntry | null>(null);
  const toast = useToast();
  const tests = entries.filter((e) => e.test).length;
  const ago = (e: MyActivityEntry) => Math.round((new Date(today).getTime() - new Date(manilaParts(e.at).day).getTime()) / 864e5);
  const list = entries.filter(
    (e) =>
      (test || !e.test) &&
      (c === "all" || kind(e.cat) === c) &&
      (u === "all" || e.actor === u) &&
      (d === "all" || (d === "today" ? ago(e) === 0 : ago(e) <= Number(d))) &&
      (!q || `${e.title} ${e.context ?? ""} ${e.actor}`.toLowerCase().includes(q.toLowerCase())),
  );
  const users = [...new Set(entries.map((e) => e.actor))].sort();
  return (
    <div className="card">
      <div className="ch">
        <div>
          <h2>⟲ System Activity</h2>
          <div className="sub">Everything users and the system did in QAC-WARDS</div>
        </div>
        <Btn
          variant="o"
          sm
          href={csv(
            entries.filter((e) => !e.test),
            true,
            (x) => ACAT[kind(x)]?.[0] ?? "Accounts",
          )}
          download="QAC-WARDS-activity.csv"
          onClick={() => toast.say("Activity exported")}
        >
          ⬇ Export CSV
        </Btn>
      </div>
      <FilterPills
        value={c}
        onChange={(k) => {
          setC(k);
          setN(12);
        }}
        items={[{ key: "all", label: "All" }, ...Object.entries(ACAT).map(([k, v]) => ({ key: k, label: v[0] }))]}
      />
      <div className="ftools" style={{ marginBottom: 10 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search activity" />
        <label className="fl">User</label>
        <select className="inp" value={u} onChange={(e) => setU(e.target.value)}>
          <option value="all">Everyone</option>
          {users.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label className="fl">Date</label>
        <select className="inp" value={d} onChange={(e) => setD(e.target.value)}>
          {[
            ["all", "All time"],
            ["today", "Today"],
            ["7", "Last 7 days"],
            ["30", "Last 30 days"],
          ].map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <Toggle checked={test} onChange={setTest} label={`Show test data (${tests})`} />
      </div>
      {list.length ? (
        <>
          {list.slice(0, n).map((e, i, arr) => {
            const p = manilaParts(e.at);
            const lab = p.day === today ? "Today" : p.short;
            const head = i === 0 || manilaParts(arr[i - 1].at).day !== p.day ? <div className="day">{lab}</div> : null;
            const m = ACAT[kind(e.cat)] ?? ACAT.acct;
            return (
              <div key={e.id}>
                {head}
                <div className={`it${e.test ? " tst2" : ""}`}>
                  <div className="aic" style={{ background: m[2] }}>
                    {m[1]}
                  </div>
                  <div className="t">
                    {e.title}
                    {e.test && (
                      <>
                        {" "}
                        <span className="pill p-ret">Test data</span>
                      </>
                    )}
                    {e.context && <small>{e.context}</small>}
                    <small>
                      By <b style={{ color: "var(--text)", fontWeight: 600 }}>{e.actor}</b> · <RoleChip role={e.actorRole} />
                    </small>
                  </div>
                  <span className="tm">{p.time}</span>
                  <span className="v">
                    <a className="lnk" role="button" onClick={() => setView(e)}>
                      View ›
                    </a>
                  </span>
                </div>
              </div>
            );
          })}
          {list.length > n && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Btn variant="o" onClick={() => setN(n + 12)}>
                Show older activity ({list.length - n})
              </Btn>
            </div>
          )}
        </>
      ) : (
        <Empty icon="🔎">No activity matches your filters.</Empty>
      )}
      {view && (
        <Modal
          title={view.title}
          sub={`${manilaParts(view.at).short} · ${manilaParts(view.at).time}`}
          onClose={() => setView(null)}
          footer={<Btn onClick={() => setView(null)}>Close</Btn>}
        >
          <SumRows
            flush
            rows={[
              ["By", view.actor],
              ["Role", roleLabel(view.actorRole)],
              ["Type", ACAT[kind(view.cat)]?.[0] ?? "Accounts"],
              ...(view.context ? ([["Details", view.context]] as [string, string][]) : []),
              ["IP address", view.ip ?? "—"],
              ["Device", "—"],
            ]}
          />
        </Modal>
      )}
    </div>
  );
}
