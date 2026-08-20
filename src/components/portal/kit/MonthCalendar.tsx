"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState } from "react";

export type DayMark = "vacant" | "event" | "holiday";

const MARK_COLOR: Record<DayMark, string> = {
  vacant: "bg-yellow",
  event: "bg-maroon",
  holiday: "bg-holiday",
};

/** Popup title colour follows the day's mark. */
const POPUP_COLOR: Partial<Record<DayMark, string>> = {
  event: "text-maroon",
  holiday: "text-holiday",
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
  /** Event titles keyed by day-of-month; a day with one is clickable. */
  events?: Record<number, string>;
  /** Fires when Prev/Next moves the grid to a different month, so a caller
   *  backed by real data can fetch that month's marks/events — `marks`/
   *  `events` are a single month's data, not a lookahead cache. */
  onMonthChange?: (year: number, month: number) => void;
};

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * Month grid used on Events: yellow title bar with prev/next, weekday row, then
 * six weeks of cells. Each cell shows its date top-right and a status dot
 * bottom-left. Days outside the month are greyed and carry no dot.
 */
export default function MonthCalendar({ month, marks, events = {}, onMonthChange }: CalendarMonth) {
  const [cursor, setCursor] = useState(month);
  const [open, setOpen] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

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
  const step = (delta: number) => {
    setOpen(null);
    setFocusIndex(0);
    const next = new Date(year, m + delta, 1);
    setCursor(next);
    onMonthChange?.(next.getFullYear(), next.getMonth() + 1);
  };

  const arrow = "flex h-[34px] w-[34px] items-center justify-center text-black transition-opacity hover:opacity-60";

  /** `role="grid"` keyboard navigation (09-ui-refactor §D.6): arrows move one
   *  cell, Home/End jump to the week's edges, PgUp/PgDn change month, Enter
   *  opens the focused day's event if it has one. Roving tabindex — one cell
   *  is a tab stop at a time, matching the WAI-ARIA grid pattern. */
  function onGridKeyDown(e: React.KeyboardEvent) {
    const key = e.key;
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    };
    if (key in moves) {
      e.preventDefault();
      const next = Math.min(cells.length - 1, Math.max(0, focusIndex + moves[key]));
      setFocusIndex(next);
      gridRef.current?.querySelectorAll<HTMLElement>("[data-cell]")[next]?.focus();
      return;
    }
    if (key === "Home" || key === "End") {
      e.preventDefault();
      const rowStart = focusIndex - (focusIndex % 7);
      const next = key === "Home" ? rowStart : rowStart + 6;
      setFocusIndex(next);
      gridRef.current?.querySelectorAll<HTMLElement>("[data-cell]")[next]?.focus();
      return;
    }
    if (key === "PageUp" || key === "PageDown") {
      e.preventDefault();
      step(key === "PageUp" ? -1 : 1);
      requestAnimationFrame(() => {
        gridRef.current?.querySelectorAll<HTMLElement>("[data-cell]")[0]?.focus();
      });
      return;
    }
    if (key === "Enter" || key === " ") {
      const cell = cells[focusIndex];
      if (cell.inMonth && sameMonth && events[cell.day]) {
        e.preventDefault();
        setOpen(cell.day);
      }
    }
  }

  return (
    <div className="relative w-full max-w-[785px] rounded-[20px] bg-white shadow-card">
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

      <div
        ref={gridRef}
        role="grid"
        aria-label={monthLabel(cursor)}
        onKeyDown={onGridKeyDown}
        className="grid grid-cols-7 gap-[7px] p-[10px] pb-[20px]"
      >
        {cells.map((c, i) => {
          const hasEvent = c.inMonth && sameMonth && !!events[c.day];
          const isToday =
            c.inMonth &&
            sameMonth &&
            c.day === new Date().getDate() &&
            m === new Date().getMonth() &&
            year === new Date().getFullYear();
          const cls = `relative h-[70px] rounded-[10px] bg-white shadow-card ${
            hasEvent ? "cursor-pointer transition-transform hover:-translate-y-[1px]" : ""
          } ${isToday ? "ring-2 ring-inset ring-maroon" : ""}`;
          const inner = (
            <>
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
            </>
          );
          const roleProps = {
            role: "gridcell" as const,
            "data-cell": true,
            tabIndex: i === focusIndex ? 0 : -1,
            onFocus: () => setFocusIndex(i),
          };
          return hasEvent ? (
            <button
              type="button"
              key={`${c.day}-${i}`}
              onClick={() => setOpen(c.day)}
              className={`${cls} text-left`}
              {...roleProps}
            >
              {inner}
            </button>
          ) : (
            <div key={`${c.day}-${i}`} className={cls} {...roleProps}>
              {inner}
            </div>
          );
        })}
      </div>

      {open !== null && events[open] && (
        <>
          {/* Grey scrim over the grid (not the yellow header) so the popup pops;
             doubles as a click-away. Dims the white cells to #B3B3B3. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(null)}
            className="absolute inset-x-0 bottom-0 top-[55px] z-10 rounded-b-[20px] bg-black/30"
          />
          <div className="absolute left-1/2 top-1/2 z-20 flex h-[161px] w-[253px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[14px] bg-white px-[26px] shadow-[0_6px_24px_rgba(0,0,0,0.18)]">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(null)}
              className="absolute right-[14px] top-[14px] text-gray transition-opacity hover:opacity-60"
            >
              <X className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
            </button>
            <p
              className={`text-center text-regular leading-[16px] ${POPUP_COLOR[marks[open]] ?? "text-holiday"}`}
            >
              {events[open]}
            </p>
          </div>
        </>
      )}
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
