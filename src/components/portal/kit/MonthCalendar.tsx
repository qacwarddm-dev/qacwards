"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export type DayMark = "vacant" | "event" | "holiday";

const MARK_COLOR: Record<DayMark, string> = {
  vacant: "bg-yellow",
  event: "bg-maroon",
  holiday: "bg-holiday",
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type CalendarMonth = {
  /** First of the month. */
  month: Date;
  /** Marks keyed by day-of-month. */
  marks: Record<number, DayMark>;
};

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Month grid used on Events: yellow title bar with prev/next, weekday row, then
 * six weeks of cells. Each cell shows its date top-right and a status dot
 * bottom-left. Days outside the month are greyed and carry no dot.
 */
export default function MonthCalendar({ month, marks }: CalendarMonth) {
  const [cursor, setCursor] = useState(month);

  const year = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const daysInPrev = new Date(year, m, 0).getDate();
  const lead = first.getDay();

  const cells: { day: number; inMonth: boolean }[] = [];
  for (let i = lead - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0 || cells.length < 35)
    cells.push({ day: cells.length - lead - daysInMonth + 1, inMonth: false });

  const sameMonth = cursor.getMonth() === month.getMonth() && cursor.getFullYear() === month.getFullYear();
  const step = (delta: number) => setCursor(new Date(year, m + delta, 1));

  const arrow = "flex h-[34px] w-[34px] items-center justify-center text-black transition-opacity hover:opacity-60";

  return (
    <div className="w-[785px] rounded-[20px] bg-white shadow-card">
      <div className="flex h-[55px] items-center justify-between rounded-t-[20px] bg-yellow px-[22px]">
        <button type="button" aria-label="Previous month" onClick={() => step(-1)} className={arrow}>
          <ChevronLeft className="h-[26px] w-[26px]" strokeWidth={3} aria-hidden />
        </button>
        <span className="text-heading font-bold leading-none text-black">
          {monthLabel(cursor)}
        </span>
        <button type="button" aria-label="Next month" onClick={() => step(1)} className={arrow}>
          <ChevronRight className="h-[26px] w-[26px]" strokeWidth={3} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 px-[10px] pt-[16px] text-center text-subheading font-bold leading-none text-maroon">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[7px] p-[10px] pb-[20px]">
        {cells.map((c, i) => (
          <div
            key={`${c.day}-${i}`}
            className="relative h-[70px] rounded-[10px] bg-white shadow-card"
          >
            <span
              className={`absolute right-[10px] top-[8px] text-subheading font-bold leading-none ${
                c.inMonth ? "text-maroon" : "text-[color:var(--color-gray)]/60"
              }`}
            >
              {c.day}
            </span>
            {c.inMonth && sameMonth && marks[c.day] && (
              <span
                className={`absolute bottom-[9px] left-[10px] h-[13px] w-[13px] rounded-full ${MARK_COLOR[marks[c.day]]}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Colour key shown beside the calendar. */
export function CalendarLegend() {
  const items: [DayMark, string][] = [
    ["vacant", "Vacant Day"],
    ["event", "Scheduled Event"],
    ["holiday", "Holiday"],
  ];
  return (
    <div>
      <h3 className="text-subheading font-bold leading-none text-maroon">LEGENDS</h3>
      <ul className="mt-[16px] space-y-[10px]">
        {items.map(([mark, label]) => (
          <li key={mark} className="flex items-center gap-[12px]">
            <span className={`h-[14px] w-[14px] rounded-full ${MARK_COLOR[mark]}`} />
            <span className="text-subheading leading-none text-black">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
