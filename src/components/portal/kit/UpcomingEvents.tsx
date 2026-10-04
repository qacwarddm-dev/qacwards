"use client";

import Link from "next/link";
import useNav from "./nav";
import MiniCalendar from "./MiniCalendar";
import { MON, TC, WD, cdTxt, daysBetween, evEnd, evStart, parseDay, type CalEvent } from "./calendar";

export type NextDeadline = {
  days: number;
  ringPct: number;
  kicker: string;
  title: string;
  text: React.ReactNode;
  progress?: { label: string; pct: number };
  action: { label: string; href: string };
};

export default function UpcomingEvents({
  next,
  events,
  today,
  variant,
  tagsFor,
}: {
  next: NextDeadline | null;
  events: CalEvent[];
  today: string;
  variant: "ia" | "rep";
  tagsFor?: (e: CalEvent) => React.ReactNode;
}) {
  const router = useNav();
  const t = parseDay(today);
  const upcoming = events.filter((e) => evEnd(e) >= t).slice(0, 4);
  const size = variant === "ia" ? 84 : 80;
  const r = variant === "ia" ? 36 : 33;
  const C = 2 * Math.PI * r;
  return (
    <div className="upgrid">
      <div>
        {next && (
          <div className="nextev">
            <div className="ring2">
              <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.2)" strokeWidth="7" fill="none" />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke="#ffd54f"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - next.ringPct / 100)}
                />
              </svg>
              <div>
                <b>{next.days}</b>
                <span>day{next.days === 1 ? "" : "s"} left</span>
              </div>
            </div>
            <div style={{ position: "relative", zIndex: 1, minWidth: 0 }}>
              <small>{next.kicker}</small>
              <h3>{next.title}</h3>
              <p>{next.text}</p>
              {next.progress && (
                <div className="prog">
                  <span>{next.progress.label}</span>
                  <div className="b">
                    <i style={{ width: `${next.progress.pct}%` }} />
                  </div>
                </div>
              )}
            </div>
            <Link className="go2" href={next.action.href}>
              {next.action.label}
            </Link>
          </div>
        )}
        <div className="tl2">
          {upcoming.map((e) => {
            const [c, bg, lb, ic] = TC[e.type];
            const s = evStart(e);
            const n = daysBetween(t, s);
            const multi = e.end && e.end !== e.start;
            const en = evEnd(e);
            return (
              <div key={e.id} className={`ev2${n <= 1 ? " soon" : ""}`}>
                <div className="dt">
                  <div className="m" style={{ background: c }}>
                    {MON[s.getMonth()].toUpperCase()}
                  </div>
                  <div className="d" style={{ fontSize: multi ? (variant === "ia" ? 17 : 16) : variant === "ia" ? 22 : 21 }}>
                    {multi ? `${s.getDate()}–${en.getDate()}` : s.getDate()}
                  </div>
                  <div className="w">{multi ? `${WD[s.getDay()]}–${WD[en.getDay()]}` : WD[s.getDay()]}</div>
                </div>
                <div
                  className="evc"
                  style={{ borderLeftColor: c }}
                  onClick={() => router.push(`/portal/events?date=${e.start}`)}
                  role="link"
                >
                  <div className="top">
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>
                        {ic} {lb.toUpperCase()}
                      </span>
                      <br />
                      <b>{e.title}</b>
                    </div>
                    <span className="cd" style={{ background: bg, color: c === "#d49b00" ? "#8a6d00" : c }}>
                      {cdTxt(n)}
                    </span>
                  </div>
                  <div className="meta">
                    <span>🕑 {e.time}</span>
                    <span>📍 {e.where}</span>
                    {variant === "rep" ? <span>🎓 {e.prog}</span> : e.part !== "—" && <span>{e.part}</span>}
                  </div>
                  {variant === "ia" && (
                    <div className="tags">
                      {e.prog.split(", ").map((p) => (
                        <span key={p}>{p}</span>
                      ))}
                      {tagsFor?.(e)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!upcoming.length && <div className="empty" style={{ padding: "24px 10px" }}>No upcoming events.</div>}
        </div>
      </div>
      <div style={{ alignSelf: "start" }}>
        <MiniCalendar events={events} today={today} onPick={(d) => router.push(`/portal/events?date=${d}`)} />
      </div>
    </div>
  );
}

