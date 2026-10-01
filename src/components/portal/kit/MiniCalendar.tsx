"use client";

import { useState } from "react";
import { UCOL, MONL, evEnd, evStart, parseDay, type CalEvent, type CalType } from "./calendar";

const PRIORITY: Record<CalType, number> = { visit: 0, dead: 1, meet: 2, hol: 3 };

export default function MiniCalendar({
  events,
  today,
  onPick,
  monthsAhead = 3,
}: {
  events: CalEvent[];
  today: string;
  onPick: (day: string) => void;
  monthsAhead?: number;
}) {
  const t = parseDay(today);
  const lo = t.getFullYear() * 12 + t.getMonth();
  const hi = lo + monthsAhead;
  const [ym, setYm] = useState(lo);
  const y = Math.floor(ym / 12);
  const m = ym % 12;
  const first = new Date(y, m, 1);
  const dim = new Date(y, m + 1, 0).getDate();
  const pdim = new Date(y, m, 0).getDate();

  const cells: React.ReactNode[] = ["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
    <div key={`w${i}`} className="uwd">
      {d}
    </div>
  ));
  for (let i = first.getDay(); i > 0; i--)
    cells.push(
      <div key={`p${i}`} className="ud o">
        {pdim - i + 1}
      </div>,
    );
  for (let d = 1; d <= dim; d++) {
    const dt = new Date(y, m, d);
    const on = events.filter((e) => dt >= evStart(e) && dt <= evEnd(e)).sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
    const e = on[0];
    let c = "ud";
    let style: React.CSSProperties | undefined;
    if (e) {
      c += " has";
      style = { background: UCOL[e.type][0], color: UCOL[e.type][2] };
      if (e.end && e.end !== e.start) {
        const s0 = +dt === +evStart(e) || dt.getDay() === 0;
        const e0 = +dt === +evEnd(e) || dt.getDay() === 6;
        c += s0 && e0 ? "" : s0 ? " rs" : e0 ? " re" : " rm";
      }
    }
    if (+dt === +t) c += " td";
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push(
      <div
        key={key}
        className={c}
        style={style}
        title={e ? on.map((x) => x.title).join(" • ") : undefined}
        onClick={e ? () => onPick(key) : undefined}
        role={e ? "button" : undefined}
      >
        {d}
        {on.length > 1 && <i className="more" />}
      </div>,
    );
  }
  const tot = first.getDay() + dim;
  for (let i = 1; i <= (7 - (tot % 7)) % 7; i++)
    cells.push(
      <div key={`n${i}`} className="ud o">
        {i}
      </div>,
    );

  return (
    <div className="ucal">
      <div className="uch">
        <button type="button" disabled={ym <= lo} onClick={() => setYm(ym - 1)} aria-label="Previous month">
          ‹
        </button>
        <b>
          {MONL[m]} {y}
        </b>
        <button type="button" disabled={ym >= hi} onClick={() => setYm(ym + 1)} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="ug">{cells}</div>
      <div className="uleg">
        {Object.values(UCOL).map((x) => (
          <span key={x[1]}>
            <i style={{ background: x[0] }} />
            {x[1]}
          </span>
        ))}
      </div>
      <div className="uhint">Click a colored day to see its events</div>
    </div>
  );
}
