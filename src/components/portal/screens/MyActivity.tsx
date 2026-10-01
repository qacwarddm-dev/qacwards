"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BackLink from "../kit/BackLink";
import Btn from "../kit/Btn";
import Empty from "../kit/Empty";
import FilterPills from "../kit/FilterPills";
import SearchBox from "../kit/SearchBox";
import Scope from "../kit/Scope";
import { useToast } from "../kit/ToastProvider";
import type { ActivityCat, MyActivityEntry } from "@/lib/activity";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function manilaParts(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(d);
  const [y, m, dd] = day.split("-").map(Number);
  return { day, time, label: `${MON[m - 1]} ${String(dd).padStart(2, "0")}, ${y}`, short: `${MON[m - 1]} ${dd}, ${y}` };
}

function dayLabel(day: string, today: string, short: string, relative: boolean) {
  if (!relative) return short;
  if (day === today) return "Today";
  const diff = Math.round((new Date(today).getTime() - new Date(day).getTime()) / 864e5);
  return diff === 1 ? "Yesterday" : short;
}

const IA_ICON: Record<string, [string, string, string]> = {
  eval: ["#fdecec", "#c62828", "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5M14 3v5h5v3M13 20l1-3 6-6 2 2-6 6z"],
  asg: ["#fff4cc", "#a17a00", "M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4"],
  acct: ["#eee", "#555", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"],
};

function iaKind(c: ActivityCat): "eval" | "asg" | "acct" {
  return c === "rev" || c === "eval" ? "eval" : c === "asg" ? "asg" : "acct";
}

/** Internal Accreditor: tab buttons, SVG icons, no View links. */
export function IaActivity({ entries, today }: { entries: MyActivityEntry[]; today: string }) {
  const [f, setF] = useState<"all" | "eval" | "asg" | "acct">("all");
  const list = entries.filter((e) => f === "all" || iaKind(e.cat) === f);
  return (
    <Scope name="ia">
      <div className="card">
        <div className="ch">
          <div>
            <Link className="lnk" href="/portal/profile">
              ‹ Back to Profile
            </Link>
            <h2 style={{ marginTop: 8 }}>My Activity</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(
              [
                ["all", "All"],
                ["eval", "Evaluations"],
                ["asg", "Assignments"],
                ["acct", "Account"],
              ] as const
            ).map(([k, l]) => (
              <button key={k} type="button" className={`tab${f === k ? " on" : ""}`} onClick={() => setF(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {list.length ? (
          list.map((e, i, arr) => {
            const p = manilaParts(e.at);
            const head = i === 0 || manilaParts(arr[i - 1].at).day !== p.day ? <div className="day">{dayLabel(p.day, today, p.label, true)}</div> : null;
            const [bg, fg, d] = IA_ICON[iaKind(e.cat)];
            return (
              <div key={e.id}>
                {head}
                <div className="it">
                  <div className="aic" style={{ background: bg }}>
                    <svg viewBox="0 0 24 24" style={{ stroke: fg }}>
                      <path d={d} />
                    </svg>
                  </div>
                  <div className="t">
                    {e.title}
                    {e.context && <small>{e.context}</small>}
                  </div>
                  <span className="tm">{p.time}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="ph">No activity here yet.</div>
        )}
      </div>
    </Scope>
  );
}

const REP_ICON: Record<string, [string, string]> = {
  sub: ["⬆", "#fdecec"],
  agr: ["✍️", "#e8eefb"],
  eval: ["⭐", "#f3e8fb"],
  acct: ["📷", "#e9f7ec"],
};

function repKind(c: ActivityCat): "sub" | "agr" | "eval" | "acct" {
  return c === "sub" ? "sub" : c === "agr" ? "agr" : c === "eval" || c === "rev" ? "eval" : "acct";
}

/** Program Representative: pill filters, emoji icons, View › links. */
export function RepActivity({ entries, initial }: { entries: MyActivityEntry[]; initial?: string }) {
  const [f, setF] = useState<"all" | "sub" | "agr" | "eval" | "acct">((initial as "sub") ?? "all");
  const list = entries.filter((e) => f === "all" || repKind(e.cat) === f);
  return (
    <div className="card">
      <div className="ch">
        <div>
          <BackLink to="Profile" href="/portal/profile" />
          <h2 style={{ marginTop: 6 }}>⟲ My Activity</h2>
        </div>
        <FilterPills
          flush
          value={f}
          onChange={setF}
          items={[
            { key: "all", label: "All" },
            { key: "sub", label: "Submissions" },
            { key: "agr", label: "Agreements" },
            { key: "eval", label: "Evaluations" },
            { key: "acct", label: "Account" },
          ]}
        />
      </div>
      {list.length ? (
        list.map((e, i, arr) => {
          const p = manilaParts(e.at);
          const head = i === 0 || manilaParts(arr[i - 1].at).day !== p.day ? <div className="day">{p.label}</div> : null;
          const k = repKind(e.cat);
          const [ic, bg] = e.title.toLowerCase().includes("password") ? ["🔑", "#eee"] : e.title.toLowerCase().includes("submitted") && k === "sub" ? ["📨", "#e8eefb"] : REP_ICON[k];
          return (
            <div key={e.id}>
              {head}
              <div className="it">
                <div className="aic" style={{ background: bg }}>
                  {ic}
                </div>
                <div className="t">
                  {e.title}
                  {e.context && <small>{e.context}</small>}
                </div>
                <span className="tm">{p.time}</span>
                <span className="v">
                  {e.href && (
                    <Link className="lnk" href={e.href}>
                      View ›
                    </Link>
                  )}
                </span>
              </div>
            </div>
          );
        })
      ) : (
        <Empty>No activity here yet.</Empty>
      )}
    </div>
  );
}

export const MC: Record<string, [string, string, string]> = {
  rev: ["Reviews", "✓", "#e9f7ec"],
  asg: ["Assignments", "👥", "#e8eefb"],
  file: ["Files", "📁", "#fff6d6"],
  rep: ["Reports", "📊", "#f6eaea"],
  ev: ["Events", "🗓", "#e3f4f4"],
  agr: ["Agreements", "✍", "#eef0fb"],
  set: ["Settings", "⚙", "#fff6d6"],
  acct: ["Account", "👤", "#f3f3f3"],
};

function qacKind(c: ActivityCat) {
  return c === "sub" || c === "eval" ? "rev" : c === "sys" ? "set" : c;
}

function csv(rows: MyActivityEntry[], withActor: boolean, cat: (c: ActivityCat) => string) {
  const q = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Date", "Time", "Type", "Activity", "Details", ...(withActor ? ["By", "Role"] : [])];
  const body = rows.map((e) => {
    const p = manilaParts(e.at);
    return [p.short, p.time, cat(e.cat), e.title, e.context ?? "", ...(withActor ? [e.actor, e.actorRole] : [])];
  });
  return "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + [head, ...body].map((r) => r.map(q).join(",")).join("\r\n"));
}

/** QAC Personnel / Admin: stat tiles, category pills with counts, search, date range, CSV. */
export function QacActivity({
  entries,
  today,
  admin,
  lastSignIn,
}: {
  entries: MyActivityEntry[];
  today: string;
  admin: boolean;
  lastSignIn: string;
}) {
  const [c, setC] = useState("all");
  const [q, setQ] = useState("");
  const [d, setD] = useState("all");
  const [n, setN] = useState(10);
  const toast = useToast();
  const ago = (e: MyActivityEntry) => Math.round((new Date(today).getTime() - new Date(manilaParts(e.at).day).getTime()) / 864e5);
  const week = entries.filter((e) => ago(e) <= 7);
  const cnt = (k: string) => entries.filter((e) => k === "all" || qacKind(e.cat) === k).length;
  const list = useMemo(
    () =>
      entries.filter(
        (e) =>
          (c === "all" || qacKind(e.cat) === c) &&
          (d === "all" || ago(e) <= Number(d)) &&
          (!q || `${e.title} ${e.context ?? ""}`.toLowerCase().includes(q.toLowerCase())),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, c, d, q],
  );
  const tiles: [string, number | string, string][] = [
    ["This week", week.length, "actions"],
    admin ? ["Settings changes", week.filter((e) => qacKind(e.cat) === "set").length, "this week"] : ["Reviews", week.filter((e) => qacKind(e.cat) === "rev").length, "this week"],
    admin ? ["Reports", entries.filter((e) => e.cat === "rep").length, "generated"] : ["Assignments", entries.filter((e) => e.cat === "asg").length, "all time"],
    ["Last sign-in", lastSignIn.split(" · ")[0], lastSignIn.split(" · ").slice(1).join(" · ")],
  ];
  return (
    <div className="card">
      <div className="ch">
        <div>
          <BackLink to="Profile" href="/portal/profile" />
          <h2 style={{ marginTop: 8 }}>⟲ My Activity</h2>
          <div className="sub">What you did in QAC-WARDS · visible only to you and the QAC Admin</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {admin && (
            <Btn variant="gh" sm href="/portal/activity">
              System activity ›
            </Btn>
          )}
          <Btn variant="o" sm href={csv(entries, false, (x) => MC[qacKind(x)]?.[0] ?? "Account")} download="my-activity.csv" onClick={() => toast.say("Exported")}>
            ⬇ Export CSV
          </Btn>
        </div>
      </div>
      <div className="mast">
        {tiles.map(([l, v, s]) => (
          <div key={l}>
            <span>{l}</span>
            <b>{v}</b>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <FilterPills
        value={c}
        onChange={(k) => {
          setC(k);
          setN(10);
        }}
        items={[
          {
            key: "all",
            label: (
              <>
                All <span style={{ opacity: 0.7 }}>{cnt("all")}</span>
              </>
            ),
          },
          ...Object.entries(MC)
            .filter(([k]) => cnt(k))
            .map(([k, v]) => ({
              key: k,
              label: (
                <>
                  {v[0]} <span style={{ opacity: 0.7 }}>{cnt(k)}</span>
                </>
              ),
            })),
        ]}
      />
      <div className="ftools" style={{ marginBottom: 6 }}>
        <SearchBox value={q} onChange={setQ} placeholder="Search, e.g. “BSIT” or “returned”" />
        <label className="fl">Date</label>
        <select className="inp" value={d} onChange={(e) => setD(e.target.value)}>
          {[
            ["all", "All time"],
            ["0", "Today"],
            ["7", "Last 7 days"],
            ["30", "Last 30 days"],
          ].map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {list.length ? (
        <>
          {list.slice(0, n).map((e, i, arr) => {
            const p = manilaParts(e.at);
            const lab = dayLabel(p.day, today, p.short, true);
            const head = i === 0 || manilaParts(arr[i - 1].at).day !== p.day ? <div className="day">{lab}</div> : null;
            const m = MC[qacKind(e.cat)] ?? MC.acct;
            return (
              <div key={e.id}>
                {head}
                <div className="it">
                  <div className="aic" style={{ background: m[2] }}>
                    {m[1]}
                  </div>
                  <div className="t">
                    {e.title}
                    {e.context && <small>{e.context}</small>}
                  </div>
                  <span className="tm">{p.time}</span>
                  <span className="v">
                    {e.href && (
                      <Link className="lnk" href={e.href}>
                        View ›
                      </Link>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          {list.length > n && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Btn variant="o" onClick={() => setN(n + 10)}>
                Show older activity ({list.length - n})
              </Btn>
            </div>
          )}
        </>
      ) : (
        <Empty icon="🔎">
          No activity matches your filters.
          <br />
          <a
            className="lnk"
            role="button"
            onClick={() => {
              setC("all");
              setQ("");
              setD("all");
              setN(10);
            }}
          >
            Clear filters
          </a>
        </Empty>
      )}
    </div>
  );
}

export { manilaParts, csv, qacKind };
