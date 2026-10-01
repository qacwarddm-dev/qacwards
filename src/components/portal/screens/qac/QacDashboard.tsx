"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import AccreditorChips from "../../kit/AccreditorChips";
import { RBar } from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import MiniCalendar from "../../kit/MiniCalendar";
import Pill, { ReviewChip } from "../../kit/Pill";
import StatTile, { StatGrid } from "../../kit/StatTile";
import { useToast } from "../../kit/ToastProvider";
import { MON, TC, cdTxt, daysUntil, evEnd, parseDay, type CalEvent } from "../../kit/calendar";
import { LVS, daysTo, phaseCounts, qacStatus, readiness, type QacProgram } from "@/lib/qac-model";
import type { NdaItem, SystemStatus } from "@/lib/qac-portal";
import { sendReminder } from "@/lib/qac-actions";

type Todo = { ic: string; bg: string; c: string; t: string; s: string; b: string; href?: string; act?: () => void };

export default function QacDashboard({
  hello,
  programs,
  totals,
  ndas,
  events,
  today,
  asOf,
  system,
}: {
  hello: string;
  programs: QacProgram[];
  totals: { offered: number; main: number; other: number; campuses: number; copc: number };
  ndas: NdaItem[];
  events: CalEvent[];
  today: string;
  asOf: string;
  system: SystemStatus | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const ong = programs.filter((p) => p.inproc);

  const T: Todo[] = [];
  for (const p of ong) {
    const c = phaseCounts(p);
    if (c.pe) T.push({ ic: "📄", bg: "#fff6d6", c: "#8a6d00", t: `Review ${c.pe} phase document${c.pe > 1 ? "s" : ""} · ${p.short}`, s: "Extension Monitoring · Pre-Accreditation Phases", b: "Review", href: `/portal/extension-monitoring?p=${p.id}` });
  }
  for (const p of ong) {
    const n = p.reports.filter((r) => r.status === "submitted").length;
    if (n) T.push({ ic: "📨", bg: "#e8eefb", c: "#1f4fa3", t: `Review ${n} evaluation report(s) · ${p.short}`, s: `Signed by the internal accreditors · ${p.levelName}`, b: "Review", href: `/portal/assignment?id=${p.id}&stage=rep` });
  }
  for (const n of ndas.filter((x) => x.status === "review"))
    T.push({ ic: "🪪", bg: "#fdecec", c: "#b42323", t: `Verify NDA · ${n.who} (${n.college})`, s: `Uploaded ${n.date} · check the NDA File ID and notarial details`, b: "Verify", href: `/portal/documents?tab=nda&verify=${n.id}` });
  for (const p of ong) {
    const act = p.team.filter((m) => m.response !== "rejected").length;
    if (act < 2) T.push({ ic: "👥", bg: "#fdecec", c: "#b42323", t: `Assign ${2 - act} accreditor${2 - act > 1 ? "s" : ""} · ${p.short}`, s: `${p.levelName} · visit ${p.visitLabel}`, b: "Assign", href: `/portal/assignment?new=1&edit=${p.id}` });
  }
  for (const p of ong) {
    const w = p.team.find((m) => m.response === "pending");
    if (w)
      T.push({
        ic: "⏳",
        bg: "#f3f3f3",
        c: "#555",
        t: `${w.surname} hasn’t accepted · ${p.short}`,
        s: "Send a reminder or reassign",
        b: "Remind",
        act: () =>
          start(async () => {
            const r = await sendReminder(w.id, `Reminder: please accept the ${p.short} ${p.levelName} assignment.`, "/portal/assignment");
            toast.say(r.ok ? `Reminder sent to ${w.name}` : r.error, !r.ok);
          }),
      });
  }
  const exp = programs.filter((p) => !p.inproc && p.to && daysTo(p.to, today) <= 183).length;
  if (exp) T.push({ ic: "⚠", bg: "#fdecec", c: "#b42323", t: `${exp} accreditation${exp > 1 ? "s" : ""} expired or expiring within 6 months`, s: "Generate the validity report and notify the colleges", b: "Report", href: "/portal/reports?new=expired" });

  const t0 = parseDay(today);
  const upcoming = events.filter((e) => evEnd(e) >= t0);
  const nextVisit = upcoming.find((e) => e.type === "visit");
  const bars = LVS.map(([k, s]) => ({ k, s, v: programs.filter((p) => p.levelCode === k && !p.inproc).length, w: programs.filter((p) => p.levelCode === k && p.inproc).length }));
  const mx = Math.max(1, ...bars.map((x) => x.v + x.w));

  const recent = ong
    .flatMap((p) => (p.review ? p.review.phases.flatMap((g) => g.docs.filter((d) => d.uploadedAt && d.state !== "draft").map((d) => ({ p, g, d }))) : []))
    .sort((a, b) => (b.d.uploadedAt ?? "").localeCompare(a.d.uploadedAt ?? ""))
    .slice(0, 7);

  return (
    <>
      <div className="hero">
        <div>
          <h1>{hello}</h1>
          <p>
            {T.length} item{T.length === 1 ? "" : "s"} need your action · {ong.length} programs in accreditation
            {nextVisit ? ` · next visit: ${nextVisit.title} on ${MON[parseDay(nextVisit.start).getMonth()]} ${parseDay(nextVisit.start).getDate()}` : ""}
          </p>
        </div>
        <div className="hb">
          <Btn href="/portal/assignment?new=1">＋ New assignment</Btn>
          <Btn variant="plain" className="ghost" href="/portal/reports">
            Generate report
          </Btn>
        </div>
      </div>
      <StatGrid cols={5}>
        <StatTile label="Programs offered" value={totals.offered} sub={`All campuses · as of ${asOf}`} href="/portal/aaccup-copc" />
        <StatTile label="Main campus" value={totals.main} sub="Sta. Mesa, Manila" href="/portal/aaccup-copc?loc=main" />
        <StatTile label="Other campuses" value={totals.other} sub={`${totals.campuses} campuses`} href="/portal/aaccup-copc?loc=camp" />
        <StatTile label="With COPC" value={totals.copc} sub="Certificate of Program Compliance" href="/portal/reports?new=copc" />
        <StatTile label="Without COPC" value={totals.offered - totals.copc} sub="Not yet accreditable" href="/portal/reports?new=copc" />
      </StatGrid>
      {system && (
        <Card>
          <CardHead title="System status" sub="Director only · open Settings for details" />
          <div className="sysg">
            <div onClick={() => router.push("/portal/settings?tab=cycles")}>
              <span>Accreditation cycle</span>
              <b>{system.cycle?.name ?? "None open"}</b>
              <small>{system.cycle ? `Open · ends ${system.cycle.end} (${system.cycle.days} days)` : "Start a new cycle"}</small>
            </div>
            <div onClick={() => router.push("/portal/settings?tab=email")}>
              <span>Email queue</span>
              <b>{system.queued} queued</b>
              <small>{system.queued ? "Auto-sends every 15 minutes" : "All sent"}</small>
            </div>
            <div onClick={() => router.push("/portal/settings?tab=backup")}>
              <span>Last backup</span>
              <b>{system.backup?.date ?? "None yet"}</b>
              <small>{system.backup ? `${system.backup.time} · ${system.backup.size} · ${system.backup.ok ? "✓ successful" : "failed"}` : "Back up from Settings"}</small>
            </div>
            <div onClick={() => router.push("/portal/settings?tab=users")}>
              <span>Users</span>
              <b>{system.users.active} active</b>
              <small>
                {system.users.invited} invited · {system.users.inactive} deactivated
              </small>
            </div>
            <div onClick={() => router.push("/portal/settings?tab=public")}>
              <span>Public page</span>
              <b>{system.publicLive ? "Published" : "Hidden"}</b>
              <small>{system.announcements} announcements live</small>
            </div>
          </div>
        </Card>
      )}
      <div className="g2 g2a">
        <div className="card fixh">
          <CardHead title="Needs your action" sub="Sorted by what blocks the process first" right={<Pill tone="ret">{T.length}</Pill>} />
          <div className="scl2">
            {T.length ? (
              T.map((x, i) => (
                <div key={i} className="upl" role="button" onClick={() => (x.href ? router.push(x.href) : x.act?.())}>
                  <div className="fi" style={{ background: x.bg, color: x.c }}>
                    {x.ic}
                  </div>
                  <div className="t">
                    <b>{x.t}</b>
                    <small>{x.s}</small>
                  </div>
                  <Btn variant="o" sm>
                    {x.b}
                  </Btn>
                </div>
              ))
            ) : (
              <div className="empty">Nothing to do right now 🎉</div>
            )}
          </div>
        </div>
        <div className="card fixh">
          <CardHead title="Programs by accreditation level" sub="Click a bar to open Accreditation" />
          <div className="bch">
            {bars.map((x) => (
              <div key={x.k} className="bc" title={`${x.s}: ${x.v} accredited, ${x.w} in process`} onClick={() => router.push("/portal/assignment")}>
                <div className="bv">
                  <b>{x.v + x.w}</b>
                  <div className="bb" style={{ height: ((x.v + x.w) / mx) * 140 }}>
                    <i className="w" style={{ height: `${(x.w / (x.v + x.w || 1)) * 100}%` }} />
                  </div>
                </div>
                <span>{x.s}</span>
              </div>
            ))}
          </div>
          <div className="bleg">
            <span>
              <i style={{ background: "var(--maroon)" }} />
              Accredited
            </span>
            <span>
              <i style={{ background: "#e7b7b7" }} />
              In process
            </span>
          </div>
        </div>
      </div>
      <Card>
        <CardHead
          title="Ongoing accreditation"
          sub="Program readiness = documents the program uploaded · Evaluation = what the accreditors finished"
          right={
            <Link className="lnk" href="/portal/assignment">
              Open Accreditation ›
            </Link>
          }
        />
        <div className="tscroll">
          <table className="otab">
            <thead>
              <tr>
                <th>Program</th>
                <th>Campus</th>
                <th>Level</th>
                <th>Accreditors</th>
                <th>Readiness</th>
                <th>Visit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ong.map((p) => {
                const s = qacStatus(p, today);
                return (
                  <tr key={p.id} className="click" onClick={() => router.push(`/portal/assignment?id=${p.id}`)}>
                    <td>
                      <b style={{ fontWeight: 600 }}>{p.short}</b>
                      <small>{p.name}</small>
                    </td>
                    <td>
                      {p.campus}
                      <small>{p.college}</small>
                    </td>
                    <td>{p.levelName}</td>
                    <td>
                      <AccreditorChips team={p.team} />
                    </td>
                    <td>
                      <RBar pct={readiness(p)} />
                    </td>
                    <td>{p.visitLabel}</td>
                    <td>
                      <Pill tone={s.c}>{s.t}</Pill>
                    </td>
                  </tr>
                );
              })}
              {!ong.length && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty">No program is in accreditation right now.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="g2 g2b">
        <div className="card fixh2">
          <CardHead
            title="Recent uploads"
            right={
              <Link className="lnk" href="/portal/extension-monitoring">
                View all ›
              </Link>
            }
          />
          <div className="scl2">
            {recent.length ? (
              recent.map((r) => (
                <div key={`${r.p.id}${r.d.key}`} className="upl" role="link" onClick={() => router.push(`/portal/extension-monitoring?p=${r.p.id}&g=${r.g.ordinal}`)}>
                  <div className="fi">📄</div>
                  <div className="t">
                    <b>{r.d.name}</b>
                    <small>
                      {r.p.short} · {r.g.name} · by {r.d.by ?? r.p.rep} · {r.d.date}
                    </small>
                  </div>
                  <ReviewChip state={r.d.state} />
                </div>
              ))
            ) : (
              <div className="empty">No uploads yet.</div>
            )}
          </div>
        </div>
        <div className="card fixh2">
          <CardHead
            title="Upcoming schedule"
            right={
              <Link className="lnk" href="/portal/events">
                View all ›
              </Link>
            }
          />
          <div className="upg2">
            <MiniCalendar events={events} today={today} onPick={(d) => router.push(`/portal/events?date=${d}`)} />
            <div className="upl2h">Coming up</div>
            <div className="scl2">
              {upcoming.map((e) => {
                const [c, bg, lb, ic] = TC[e.type];
                const s = parseDay(e.start);
                return (
                  <div key={e.id} className="sev" role="link" onClick={() => router.push(`/portal/events?date=${e.start}`)}>
                    <div className="sd" style={{ background: bg, color: c }}>
                      <small>{MON[s.getMonth()].toUpperCase()}</small>
                      <b>
                        {s.getDate()}
                        {e.end && e.end !== e.start ? `–${parseDay(e.end).getDate()}` : ""}
                      </b>
                    </div>
                    <div>
                      <b>{e.title}</b>
                      <small>
                        {ic} {lb} · {e.time} · {cdTxt(daysUntil(e, today))}
                      </small>
                    </div>
                  </div>
                );
              })}
              {!upcoming.length && <div className="empty">Nothing scheduled.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
