"use client";

import { useState } from "react";
import Card, { CardHead } from "../../kit/Card";
import Scope from "../../kit/Scope";
import StatTile, { StatGrid } from "../../kit/StatTile";
import UpcomingEvents from "../../kit/UpcomingEvents";
import { COLLEGE_COLOR, MON, daysUntil, nextDeadline, parseDay, type CalEvent } from "../../kit/calendar";
import ProgramCard from "./ProgramCard";
import { iaStats, type IaAssignment } from "@/lib/ia-model";

export default function IaDashboard({
  hello,
  assignments,
  events,
  today,
}: {
  hello: string;
  assignments: IaAssignment[];
  events: CalEvent[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const signed = (a: IaAssignment) => a.report?.status === "submitted" || a.report?.status === "acknowledged";
  const sub = assignments.filter(signed).length;
  const prog = assignments.filter((a) => !signed(a) && iaStats(a).started).length;
  const ns = assignments.length - sub - prog;
  const levels = [...new Set(assignments.map((a) => a.levelName))];
  const shown = assignments.filter((a) => !q || `${a.program} ${a.short} ${a.college}`.toLowerCase().includes(q.toLowerCase()));
  const colleges = [...new Set(shown.map((a) => a.college))];

  const nx = nextDeadline(events, today);
  const days = nx ? daysUntil(nx, today) : 0;
  const nd = nx ? parseDay(nx.start) : null;

  return (
    <Scope name="ia">
      <div className="hero">
        <div>
        <h1>{hello}</h1>
        <p>
          You have {assignments.length} program{assignments.length === 1 ? "" : "s"} to evaluate
          {levels.length === 1 ? ` for the ${levels[0]}` : ""}.
        </p>
        </div>
      </div>
      <StatGrid>
        <StatTile label="Assigned" value={assignments.length} sub="programs" />
        <StatTile label="Not started" value={ns} sub="waiting to begin" />
        <StatTile label="In progress" value={prog} sub="rating areas" />
        <StatTile label="Submitted" value={sub} sub="signed reports" />
      </StatGrid>
      <Card>
        <CardHead
          title="Assigned Programs"
          right={<input className="search" placeholder="Search programs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search programs" />}
        />
        {colleges.map((c) => {
          const list = shown.filter((a) => a.college === c);
          return (
            <div key={c}>
              <div className="colt">
                <div className="logo" style={{ background: COLLEGE_COLOR[c] ?? "#800000" }}>
                  {c === "—" ? "PUP" : c}
                </div>
                {list[0]?.collegeName}
              </div>
              {list.map((a) => (
                <ProgramCard key={a.id} a={a} />
              ))}
            </div>
          );
        })}
        {!shown.length && <div className="ph">{assignments.length ? "No programs match your search." : "No accepted assignments yet. New ones appear under Assignment."}</div>}
      </Card>
      <Card>
        <div className="ch">
          <h2>Upcoming Events</h2>
          <a className="lnk" href="/portal/events">
            View full calendar ›
          </a>
        </div>
        <UpcomingEvents
          variant="ia"
          today={today}
          events={events}
          next={
            nx && nd
              ? {
                  days,
                  ringPct: Math.max(0, 100 - Math.min(1, days / 30) * 100),
                  kicker: "Next deadline",
                  title: `${nx.title} · ${MON[nd.getMonth()]} ${nd.getDate()}`,
                  text: "Rate all areas and sign your evaluation reports.",
                  progress: { label: `${sub} of ${assignments.length} signed`, pct: assignments.length ? (sub / assignments.length) * 100 : 0 },
                  action: { label: sub === assignments.length && sub > 0 ? "View reports ›" : "Continue evaluating ›", href: "/portal/evaluation" },
                }
              : null
          }
          tagsFor={(e) =>
            e.type === "dead" ? (
              <span style={{ background: sub === assignments.length ? "#eaf7ec" : "#fdecec", color: sub === assignments.length ? "#1f7a30" : "#c62828" }}>
                {sub}/{assignments.length} reports signed
              </span>
            ) : null
          }
        />
      </Card>
    </Scope>
  );
}
