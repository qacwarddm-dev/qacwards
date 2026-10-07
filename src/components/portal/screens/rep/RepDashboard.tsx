"use client";

import Link from "next/link";
import useNav from "../../kit/nav";
import Bar from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card, { CardHead } from "../../kit/Card";
import Donut from "../../kit/Donut";
import Pill, { DocPill } from "../../kit/Pill";
import StatTile, { StatGrid } from "../../kit/StatTile";
import UpcomingEvents from "../../kit/UpcomingEvents";
import { MON, cdTxt, daysUntil, evEnd, nextDeadline, parseDay, type CalEvent } from "../../kit/calendar";
import { evalTitle, pendingOf, useEvaluations } from "../../kit/useEvaluations";
import { allPhaseSlots, countSlots, includedAreas } from "@/lib/review-model";
import { currentLevel, levelCounts, levelStatus, type RepProgram } from "@/lib/rep-model";
import { programMid, programShort } from "@/lib/program-names";
import type { CompletedVisit } from "@/lib/visit-evaluations";

const sub = (p: string, l: string, extra = "") => `/portal/submission?p=${p}&l=${l}${extra}`;

export default function RepDashboard({
  hello,
  programs,
  events,
  today,
  visits,
}: {
  hello: string;
  programs: RepProgram[];
  events: CalEvent[];
  today: string;
  visits: CompletedVisit[];
}) {
  const router = useNav();
  const ev = useEvaluations(visits);
  const left = ev.visits.flatMap(pendingOf);

  const current = programs.map((p) => ({ p, l: currentLevel(p) }));
  const all = current.flatMap(({ l }) => (l.review ? [...allPhaseSlots(l.review), ...includedAreas(l.review)] : []));
  const T = countSlots(all);
  const main = current[0];
  const mc = main ? levelCounts(main.l) : null;
  const t0 = parseDay(today);
  const visit = main ? events.find((e) => e.type === "visit" && e.prog.includes(programShort(main.p.name)) && evEnd(e) >= t0) : undefined;
  const nd = nextDeadline(events, today);
  const ndDate = nd ? parseDay(nd.start) : null;

  const recent = current
    .flatMap(({ p, l }) =>
      l.review
        ? [
            ...l.review.phases.flatMap((g) => g.docs.map((d) => ({ d, g: g.name, gid: `g=${g.ordinal}` }))),
            ...l.review.areas.map((d) => ({ d, g: d.name, gid: `st=req&hl=${d.refId}` })),
          ]
            .filter((x) => x.d.uploadedAt && x.d.state !== "draft")
            .map((x) => ({ ...x, p, l }))
        : [],
    )
    .sort((a, b) => (b.d.uploadedAt ?? "").localeCompare(a.d.uploadedAt ?? ""))
    .slice(0, 5);

  const revise = current.filter(({ l }) => !l.closed).flatMap(({ p, l }) =>
    l.review
      ? [...allPhaseSlots(l.review), ...includedAreas(l.review)]
          .filter((s) => s.state === "returned")
          .map((s) => ({ s, p, l }))
      : [],
  );

  const parts = [
    { label: "Approved", value: T.ap, color: "#22a33a" },
    { label: "For review", value: T.pe, color: "#eab308" },
    { label: "Needs revision", value: T.re, color: "#c62828" },
    { label: "Not uploaded", value: T.miss, color: "#d9d9d9" },
  ];
  const mainHref = main ? sub(main.p.id, main.l.levelId) : "/portal/submission";

  return (
    <>
      {left.length > 0 && (
        <div className="evb">
          <div className="i">📝</div>
          <div>
            <b>
              The {ev.visits.find((v) => pendingOf(v).length)?.visitLabel ?? "survey visit"} is complete. Please answer {left.length} short evaluation{left.length > 1 ? "s" : ""}.
            </b>
            <p>Rate the QA Center’s service and the internal accreditors who visited. About 3 minutes each.</p>
          </div>
          <div className="a">
            <Btn onClick={() => ev.open(left[0].key)}>Start</Btn>
            <Btn variant="o" href="/portal/feedback?tab=eval">
              See all
            </Btn>
          </div>
        </div>
      )}
      <div className="hero">
        <div>
          <h1>{hello}</h1>
          <p>
            {main ? (
              <>
                {programMid(main.p.name)} · {main.l.name} is <b>{mc?.pct ?? 0}% ready</b>
                {visit && (
                  <>
                    {" "}
                    · Survey visit {cdTxt(daysUntil(visit, today))} ({MON[parseDay(visit.start).getMonth()]} {parseDay(visit.start).getDate()}
                    {visit.end && visit.end !== visit.start ? `–${parseDay(visit.end).getDate()}` : ""})
                  </>
                )}
              </>
            ) : (
              "No programs are assigned to you yet."
            )}
          </p>
        </div>
        <div className="hb">
          {main && <Btn href={mainHref}>{main.l.closed ? "View" : "Continue"} {main.l.name} ›</Btn>}
          <Btn variant="plain" className="ghost" href="/portal/events">
            View calendar
          </Btn>
        </div>
      </div>
      <StatGrid>
        <StatTile label="Completion rate" icon="📊" iconBg="#f6eaea" value={`${T.pct}%`} sub={`${T.up} of ${T.req} documents · ${programs.length} program${programs.length === 1 ? "" : "s"}`} href="/portal/submission" />
        <StatTile label="Needs revision" icon="↺" iconBg="#fdecec" value={T.re} valueColor="var(--red)" sub={T.re ? "Returned by accreditors · resubmit" : "Nothing to fix"} href="/portal/feedback" />
        <StatTile label="For review" icon="⏳" iconBg="#fff6d6" value={T.pe} valueColor="#b58f00" sub="Waiting for accreditors" href={mainHref} />
        <StatTile
          label="Next deadline"
          icon="⏰"
          iconBg="#fdecec"
          small
          value={nd && ndDate ? `${MON[ndDate.getMonth()]} ${ndDate.getDate()} · ${cdTxt(daysUntil(nd, today))}` : "None"}
          sub={nd ? nd.title.replace("Deadline: ", "") : "No deadlines scheduled"}
          href={nd ? `/portal/events?date=${nd.start}` : "/portal/events"}
        />
      </StatGrid>
      <div className="g2">
        <Card>
          <CardHead title="My Programs" sub="Current level and readiness" right={<Link className="lnk" href="/portal/submission">Open Accreditation ›</Link>} />
          {current.map(({ p, l }) => {
            const s = levelCounts(l);
            const ls = levelStatus(p, l);
            return (
              <div key={p.id} className="plist">
                <Link className="pr" href={sub(p.id, l.levelId)}>
                  <div>
                    <b>{programMid(p.name)}</b>
                    <small>
                      {l.name} · <Pill tone={ls.tone}>{ls.t}</Pill> · {ls.sub}
                    </small>
                  </div>
                  <Bar pct={s.pct} color="var(--gold)" />
                  <b style={{ textAlign: "right" }}>{s.pct}%</b>
                  <span style={{ color: "#aaa" }}>›</span>
                </Link>
              </div>
            );
          })}
        </Card>
        <Card>
          <CardHead title="Document Status" sub={`All programs · ${[...new Set(current.map((c) => c.l.name))].join(" and ")}`} />
          <div className="donut">
            <Donut parts={parts} />
            <div className="lg">
              {parts.map((p) => (
                <div key={p.label} className="lgi" onClick={() => router.push(mainHref)}>
                  <i style={{ background: p.color }} />
                  {p.label}
                  <b>{p.value}</b>
                  <small>{T.req ? Math.round((p.value / T.req) * 100) : 0}%</small>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card>
        <CardHead title="Upcoming Events" sub="Deadlines, visits and meetings" right={<Link className="lnk" href="/portal/events">View full calendar ›</Link>} />
        <UpcomingEvents
          variant="rep"
          events={events}
          today={today}
          next={
            nd && ndDate && main
              ? {
                  days: daysUntil(nd, today),
                  ringPct: mc?.pct ?? 0,
                  kicker: `Next deadline · ${MON[ndDate.getMonth()]} ${ndDate.getDate()}`,
                  title: nd.title.replace("Deadline: ", ""),
                  text: `${programShort(main.p.name)} ${main.l.name} is ${mc?.pct ?? 0}% ready · ${mc?.miss ?? 0} documents to upload${mc?.re ? `, ${mc.re} to revise` : ""}.`,
                  action: { label: main.l.closed ? "View ›" : "Continue uploading ›", href: mainHref },
                }
              : null
          }
        />
      </Card>
      <div className="g2">
        <Card>
          <CardHead title="Recent Uploads" right={<Link className="lnk" href="/portal/my-activity?f=sub">View all ›</Link>} />
          {recent.length ? (
            recent.map((x) => (
              <Link key={`${x.l.levelId}${x.d.key}`} className="upl" href={sub(x.p.id, x.l.levelId, `&${x.gid}`)}>
                <div className="fi">📄</div>
                <div className="t">
                  <b>{x.d.name}</b>
                  <small>
                    {programShort(x.p.name)} · {x.l.name} · {x.g} · by {x.d.by ?? "—"} · {x.d.date}
                  </small>
                </div>
                <DocPill state={x.d.state} />
              </Link>
            ))
          ) : (
            <div className="empty">No uploads yet.</div>
          )}
        </Card>
        <Card>
          <div className="ch">
            <h2>To do</h2>
            <span className="sub" style={{ margin: 0 }}>
              {left.length + revise.length + (mc?.miss && !main?.l.closed ? 1 : 0)} items
            </span>
          </div>
          {left.map((t) => (
            <div key={t.key} className="upl" onClick={() => ev.open(t.key)} role="button">
              <div className="fi" style={{ background: "#fff6d6", color: "#8a6d00" }}>
                📝
              </div>
              <div className="t">
                <b>Answer {evalTitle(t)}</b>
                <small>{ev.visits.find((v) => v.targets.some((x) => x.key === t.key))?.visitLabel}</small>
              </div>
              <Btn sm>Answer</Btn>
            </div>
          ))}
          {revise.map(({ s, p, l }) => (
            <div key={`${l.levelId}${s.key}`} className="upl" role="link" onClick={() => router.push(`/portal/feedback?doc=${s.docId}`)}>
              <div className="fi" style={{ background: "#fdecec", color: "var(--red)" }}>
                ↺
              </div>
              <div className="t">
                <b>Revise {s.name}</b>
                <small>
                  {programShort(p.name)} · {l.name} · {s.kind === "area" ? "Accreditation Requirements" : "Pre-Accreditation Phases"}
                </small>
              </div>
              <Btn variant="o" sm>
                Open
              </Btn>
            </div>
          ))}
          {main && mc && mc.miss > 0 && !main.l.closed && (
            <div className="upl" role="link" onClick={() => router.push(mainHref)}>
              <div className="fi" style={{ background: "#f3f3f3", color: "#555" }}>
                ⬆
              </div>
              <div className="t">
                <b>
                  Upload {mc.miss} remaining {main.l.name} documents
                </b>
                <small>{nd && ndDate ? `Due ${MON[ndDate.getMonth()]} ${ndDate.getDate()}, ${ndDate.getFullYear()}` : "No deadline set"}</small>
              </div>
              <Btn variant="o" sm>
                Go
              </Btn>
            </div>
          )}
          {!left.length && !revise.length && !(mc && mc.miss && !main?.l.closed) && <div className="empty">Nothing to do right now 🎉</div>}
        </Card>
      </div>
      {ev.modals}
    </>
  );
}
