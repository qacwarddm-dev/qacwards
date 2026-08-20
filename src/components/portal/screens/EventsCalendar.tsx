"use client";

import { useState, useTransition } from "react";
import type { DayMark } from "../kit";
import { CalendarLegend, Card, MonthCalendar } from "../kit";
import { fetchMonthEvents } from "@/lib/event-actions";

type PortalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD, Manila
  kind: string;
  cancelled: boolean;
};

/**
 * `/portal/events` — assets/FIGMA/qac_personnel/04-Events.png.
 *
 * B9/task 2 made this the fetching half: `initialMonth`/`initialEvents` come
 * from `getMonthEvents()` (`src/lib/events.ts`) for the month the page loads
 * with; `MonthCalendar` manages Prev/Next itself and only ever holds one
 * month's data, so paging calls `fetchMonthEvents` (a server action) to
 * re-read the new month instead of freezing on the first one.
 *
 * The old fake data marked *every* day "vacant" (yellow) by default and only
 * overrode holidays — an artifact of static mock data, not something real
 * events have an equivalent of. Real days are unmarked unless they carry an
 * actual event.
 */
function toGrid(events: PortalEvent[]) {
  const marks: Record<number, DayMark> = {};
  const titles: Record<number, string> = {};

  for (const e of events) {
    if (e.cancelled) continue;
    const day = Number(e.date.slice(-2));
    marks[day] = e.kind === "holiday" ? "holiday" : "event";
    titles[day] = titles[day] ? `${titles[day]}; ${e.title}` : e.title;
  }

  return { marks, titles };
}

export default function EventsCalendar({
  initialMonth,
  initialEvents,
}: {
  initialMonth: Date;
  initialEvents: PortalEvent[];
}) {
  const [, startTransition] = useTransition();
  const [grid, setGrid] = useState(() => toGrid(initialEvents));

  function onMonthChange(year: number, month: number) {
    startTransition(async () => {
      const events = await fetchMonthEvents(year, month);
      setGrid(toGrid(events));
    });
  }

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <Card className="flex flex-col gap-[32px] px-[20px] py-[32px] sm:px-[32px] lg:flex-row lg:pb-[52px] lg:pt-[52px]">
        <div className="shrink-0 lg:w-[175px]">
          <h1 className="text-heading font-semibold leading-none text-black">Events</h1>
          <div className="mt-[16px] lg:mt-[56px]">
            <CalendarLegend />
          </div>
        </div>

        <MonthCalendar
          month={initialMonth}
          marks={grid.marks}
          events={grid.titles}
          onMonthChange={onMonthChange}
        />
      </Card>
    </div>
  );
}
