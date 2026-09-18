"use client";

import { useMemo, useState } from "react";
import type { ScheduleEvent } from "@/lib/events";
import {
  AvatarStack,
  Card,
  type Column,
  DataTable,
  EmptyState,
  FilterBar,
  StatRow,
  StatusPill,
} from "@/components/portal/kit";
import EventsTabs from "./EventsTabs";

const STATUSES = ["All", "Upcoming", "Ongoing", "Completed"] as const;

/** Same wording as the dashboards' stat tiles (`asOfNow`, src/lib/dashboards.ts)
 *  — not imported from there because that module pulls in the server-only
 *  Supabase client, which a "use client" screen can't bundle. */
function asOfNow(): string {
  return `As of ${new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "long", year: "numeric" })}`;
}

const COLUMNS: Column[] = [
  { key: "date", header: "Date", width: "w-[170px]" },
  { key: "title", header: "Event Title", width: "w-[220px]" },
  { key: "program", header: "Program", width: "flex-1", align: "left" },
  { key: "status", header: "Status", width: "w-[130px]" },
  { key: "participants", header: "Participants", width: "w-[160px]" },
];

/** assets/new frames/EVENTS/Event Schedule.png — the list half of the
 *  Calendar/Event Schedule tab pair (`EventsTabs`). Stat tiles count the full
 *  set regardless of the filter row below, same split `FeedbackOverview` uses
 *  between its chart (whole dataset) and its filtered list. */
export default function EventSchedule({ initialRows }: { initialRows: ScheduleEvent[] }) {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("All");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("All");

  const campuses = useMemo(
    () => ["All", ...new Set(initialRows.map((r) => r.campus).filter((c) => c !== "—"))],
    [initialRows],
  );

  const stats = useMemo(() => {
    const note = asOfNow();
    const count = (s: ScheduleEvent["status"]) => initialRows.filter((r) => r.status === s).length;
    return [
      { label: "UPCOMING", value: String(count("upcoming")), note },
      { label: "ONGOING", value: String(count("ongoing")), note },
      { label: "COMPLETED", value: String(count("completed")), note },
      { label: "TOTAL EVENTS", value: String(initialRows.length), note },
    ];
  }, [initialRows]);

  const filtered = initialRows.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.program.toLowerCase().includes(q)) return false;
    }
    if (campus !== "All" && r.campus !== campus) return false;
    if (status !== "All" && r.status !== status.toLowerCase()) return false;
    return true;
  });

  const rows = filtered.map((r) => ({
    id: r.id,
    cells: {
      date: r.date,
      title: <span className="block whitespace-normal">{r.title}</span>,
      program: (
        <span className="block whitespace-normal">
          {r.program}
          {r.collegeCampus !== "—" && (
            <span className="block text-regular italic leading-none text-gray">{r.collegeCampus}</span>
          )}
        </span>
      ),
      status: <StatusPill status={r.status} />,
      participants: <AvatarStack people={r.participants} />,
    },
  }));

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Events — Schedule</h1>
      <EventsTabs active="schedule" />

      <Card className="mt-[-1px] px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <StatRow stats={stats} />

        <div className="mt-[24px]">
          <FilterBar
            search={{ value: search, onChange: setSearch, label: "Search events" }}
            filters={[
              { label: "Campus", options: campuses, onSelect: setCampus },
              { label: "Status", options: [...STATUSES], onSelect: (v) => setStatus(v as (typeof STATUSES)[number]) },
            ]}
          />
        </div>

        <div className="mt-[20px]">
          <DataTable
            caption="Event schedule"
            columns={COLUMNS}
            rows={rows}
            empty={<EmptyState variant="no-results" title="No events found." />}
          />
        </div>
      </Card>
    </div>
  );
}
