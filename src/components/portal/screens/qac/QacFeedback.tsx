"use client";

import { useState } from "react";
import useBusy from "../../kit/useBusy";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import Empty from "../../kit/Empty";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import SearchBox from "../../kit/SearchBox";
import SegTabs from "../../kit/SegTabs";
import StatTile, { StatGrid } from "../../kit/StatTile";
import { useToast } from "../../kit/ToastProvider";
import { MON, MONL } from "../../kit/calendar";
import type { FbProgram, FeedbackData } from "@/lib/qac-feedback";
import { sendReminder } from "@/lib/qac-actions";

const LEVELS = ["Preliminary Survey Visit", "Level I", "Level II", "Level III", "Level IV"];

function Stars({ v }: { v: number }) {
  return (
    <span className="stars" title="QAC service">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`stx${v >= i ? " on" : v >= i - 0.5 ? " half" : ""}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function Chart({ data, month }: { data: (number | null)[]; month: number }) {
  const W = 720;
  const H = 200;
  const x = (i: number) => 40 + (i * (W - 60)) / 11;
  const y = (v: number) => H - 24 - ((v - 1) / 4) * (H - 44);
  const pts = data.flatMap((v, i) => (v === null || i > month ? [] : [{ i, v, px: x(i), py: y(v) }]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="fchart" role="img" aria-label="Average rating per month">
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1="40" x2={W - 20} y1={y(v)} y2={y(v)} stroke="#eee" />
          <text x="28" y={y(v) + 4} fontSize="10" fill="#999" textAnchor="end">
            {v}
          </text>
        </g>
      ))}
      <polyline fill="none" stroke="#800000" strokeWidth="2.5" points={pts.map((p) => `${p.px},${p.py}`).join(" ")} />
      {pts.map((p) => (
        <g key={p.i}>
          <circle cx={p.px} cy={p.py} r="4" fill="#fff" stroke="#800000" strokeWidth="2">
            <title>{`${MONL[p.i]}: ${p.v}`}</title>
          </circle>
          <text x={p.px} y={p.py - 10} fontSize="10" textAnchor="middle" fill="#555">
            {p.v}
          </text>
        </g>
      ))}
      {MON.map((m, i) => (
        <text key={m} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill={i > month ? "#ccc" : "#777"}>
          {m}
        </text>
      ))}
      {month < 11 && pts.length > 0 && (
        <text x={x(Math.min(10.5, (month + 12) / 2))} y={y(3)} fontSize="10" textAnchor="middle" fill="#bbb">
          no data yet
        </text>
      )}
      {!pts.length && (
        <text x={W / 2} y={y(3)} fontSize="11" textAnchor="middle" fill="#999">
          No survey answers yet this year
        </text>
      )}
    </svg>
  );
}

export default function QacFeedback({ data }: { data: FeedbackData }) {
  const [tab, setTab] = useState<"prog" | "ia">("prog");
  const [q, setQ] = useState("");
  const [lv, setLv] = useState("all");
  const [open, setOpen] = useState<FbProgram | null>(null);
  const P = data.programs;
  const tot = P.reduce((s, f) => s + f.n, 0);
  const req = P.reduce((s, f) => s + f.m, 0);
  const rated = P.filter((f) => f.n && f.q !== null);
  const avg = rated.length ? rated.reduce((s, f) => s + f.q! * f.n, 0) / rated.reduce((s, f) => s + f.n, 0) : null;
  const ql = q.toLowerCase();

  return (
    <>
      <StatGrid>
        <StatTile label="Average · QAC service" value={avg === null ? "—" : avg.toFixed(1)} sub={`out of 5 · ${data.year}`} />
        <StatTile label="Responses" value={tot} sub={`from ${req} requested`} />
        <StatTile label="Response rate" value={req ? `${Math.round((tot / req) * 100)}%` : "—"} sub="send reminders to raise it" />
        <StatTile label="Waiting" value={P.filter((f) => f.n < f.m).length} sub="programs with missing answers" />
      </StatGrid>
      <Card>
        <CardHead title="Overall summary" sub={`Average QAC service rating per month · ${data.year}`} />
        <Chart data={data.monthly} month={data.month} />
      </Card>
      <Card>
        <div className="ch">
          <SegTabs
            flush
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "prog", label: "By program" },
              { key: "ia", label: "By accreditor" },
            ]}
          />
          <div className="ftools">
            <SearchBox value={q} onChange={setQ} placeholder="Search" />
            {tab === "prog" && (
              <>
                <label className="fl">Level</label>
                <select className="inp" value={lv} onChange={(e) => setLv(e.target.value)}>
                  <option value="all">All</option>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
        {tab === "ia" ? (
          <div className="plx">
            {data.accreditors
              .filter((a) => !ql || a.name.toLowerCase().includes(ql))
              .map((a) => (
                <div key={a.id} className="prw f" style={{ cursor: "default" }}>
                  <div>
                    <b>{a.name}</b>
                    <small>{a.expertise.slice(0, 2).join(", ")}</small>
                  </div>
                  <span>{a.college}</span>
                  <span>{a.cn && a.v !== null ? <Stars v={a.v} /> : null}</span>
                  <b className="fv">{a.cn && a.v !== null ? a.v.toFixed(1) : ""}</b>
                  <span className="sub" style={{ margin: 0 }}>
                    {a.cn ? `${a.cn} rating${a.cn > 1 ? "s" : ""}` : "No visits yet"}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          (() => {
            const L = P.filter((f) => (lv === "all" || f.level === lv) && (!ql || `${f.program}${f.short}`.toLowerCase().includes(ql)));
            return L.length ? (
              <div className="plx">
                {L.map((f) => (
                  <div key={f.assignmentId} className="prw f" role="button" onClick={() => setOpen(f)}>
                    <div>
                      <b>{f.program}</b>
                      <small>
                        {f.campus} · {f.level} · visit {f.visit}
                      </small>
                    </div>
                    <span className="sub" style={{ margin: 0 }}>
                      {f.n} of {f.m} answered
                    </span>
                    {f.n && f.q !== null ? (
                      <>
                        <Stars v={f.q} />
                        <b className="fv">{f.q.toFixed(1)}</b>
                      </>
                    ) : (
                      <>
                        <Pill tone="miss">Waiting for responses</Pill>
                        <b />
                      </>
                    )}
                    <span className="chev">›</span>
                  </div>
                ))}
              </div>
            ) : (
              <Empty icon="📭">{P.length ? "No programs match your filters." : "No accreditation visit has finished yet."}</Empty>
            );
          })()
        )}
      </Card>
      {open && <DetailModal f={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function DetailModal({ f, onClose }: { f: FbProgram; onClose: () => void }) {
  const toast = useToast();
  const [busy, start] = useBusy();
  const remind = () =>
    start(async () => {
      const rs = await Promise.all(f.waiting.map((id) => sendReminder(id, `Please answer the post-visit survey for ${f.short} · ${f.level}.`, "/portal/feedback?tab=eval")));
      const bad = rs.find((r) => !r.ok);
      toast.say(bad && !bad.ok ? bad.error : `Reminder sent to ${f.waiting.length} respondent(s)`, Boolean(bad));
    });
  return (
    <Modal
      size="wide"
      title={`${f.short} · ${f.level}`}
      sub={`${f.program} · visit ${f.visit} · ${f.n} of ${f.m} answered`}
      onClose={onClose}
      footer={
        <>
          {f.waiting.length > 0 && (
            <Btn variant="o" disabled={busy} onClick={remind}>
              ✉ Send reminder
            </Btn>
          )}
          <Btn onClick={onClose}>Close</Btn>
        </>
      }
    >
      {f.n ? (
        <>
          <div className="fbd">
            <div>
              <h4>QAC Service · {f.q?.toFixed(1) ?? "—"}</h4>
              {f.qRows.map(([label, v]) => (
                <div key={label} className="qb">
                  <span>{label}</span>
                  <div className="bar">
                    <i style={{ width: `${(v / 5) * 100}%` }} />
                  </div>
                  <b>{v.toFixed(1)}</b>
                </div>
              ))}
            </div>
            <div>
              <h4>Internal Accreditors · {f.i?.toFixed(1) ?? "—"}</h4>
              {f.iRows.length ? (
                f.iRows.map(([label, v]) => (
                  <div key={label} className="qb">
                    <span>{label}</span>
                    <div className="bar">
                      <i style={{ width: `${(v / 5) * 100}%`, background: "var(--maroon)" }} />
                    </div>
                    <b>{v.toFixed(1)}</b>
                  </div>
                ))
              ) : (
                <div className="sub">No accreditor ratings yet.</div>
              )}
            </div>
          </div>
          <h4 style={{ margin: "16px 0 8px" }}>Comments</h4>
          {f.comments.length ? (
            f.comments.map((c, i) => (
              <div key={i} className="cmt">
                “{c}”<small>Anonymous · program representative</small>
              </div>
            ))
          ) : (
            <div className="sub">No comments.</div>
          )}
        </>
      ) : (
        <Empty icon="📭" title="No responses yet">
          The program rep and faculty haven’t answered the post-visit survey.
        </Empty>
      )}
    </Modal>
  );
}
