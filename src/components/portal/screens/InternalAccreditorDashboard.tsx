import type { IaDashboard, RecentUploads as RecentUploadsData } from "@/lib/dashboards";
import { Card, CardTitleBar, type Column, DataTable, MiniCalendar, type MeetingKind, RecentUploads, RecentUploadsDialog, type ScheduleEntry, StatRow, UpcomingSchedule } from "../kit";

/**
 * Internal Accreditor dashboard — client revision (2026-07), replacing the
 * original assets/FIGMA/internal_accreditor/01-Dashboard.png layout with four
 * stat tiles and three stacked cards (no updated Figma export on disk yet, so
 * this is rebuilt from the client's pasted screenshot rather than a frame).
 *
 * Banner and stat-row rhythm are untouched from the original frame (180 banner,
 * mt-[25px] to the stats). Below that the client's layout no longer pairs the
 * first table with the calendar — the calendar now sits with "Upcoming
 * Schedule" at the bottom, and "Assigned Program Evaluations" /
 * "Evaluation Progress" are each full-width cards of their own.
 */
const EVALUATION_COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "phase", header: "Current Phase", width: "w-[150px]" },
  { key: "status", header: "Status", width: "w-[100px]" },
];

// The header literally repeats "Program" in the client's frame — the first
// column's data is a campus, so this is almost certainly a client-side label
// slip (meant "Campus"). Reproduced verbatim per house rule.
const PROGRESS_COLUMNS: Column[] = [
  { key: "campus", header: "Program", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "readiness", header: "Readiness", width: "w-[240px]" },
];


export default function InternalAccreditorDashboard({
  data,
  schedule,
  uploads,
  uploadsOpen = false,
  calendar,
}: {
  data: IaDashboard;
  schedule: ScheduleEntry[];
  uploads: RecentUploadsData;
  uploadsOpen?: boolean;
  calendar: {
    month: Date;
    today: number;
    marks: Record<number, MeetingKind>;
    hrefs: Record<number, string>;
  };
}) {
  const evaluationRows = data.assignedEvaluations.map((a) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      phase: a.phase,
      status: a.status,
    },
  }));

  const progressRows = data.evaluationProgress.map((p) => ({
    id: p.id,
    cells: {
      campus: p.campus,
      program: <span className="block truncate">{p.program}</span>,
      level: p.level,
      readiness: (
        <span className="inline-flex items-center gap-[10px]">
          <span className="h-[8px] w-[140px] shrink-0 rounded-full bg-surface">
            <span
              className="block h-full rounded-full bg-yellow"
              style={{ width: `${p.readiness}%` }}
            />
          </span>
          <span className="font-semibold">{p.readiness}%</span>
        </span>
      ),
    },
  }));


  return (
    <div className="px-[var(--page-gutter)] pb-[86px] pt-[38px] lg:pl-[61px] lg:pr-[52px]">
      <section className="rounded-lg bg-maroon px-[26px] py-[20px] text-white shadow-card sm:h-[180px]">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC Dashboard!
        </h1>
        <p className="mt-[11px] text-subheading leading-none">
          Here, you can evaluate, review, and validate accreditation documents
          efficiently.
        </p>
      </section>

      <div className="mt-[25px]">
        <StatRow stats={data.stats} />
      </div>

      <Card className="mt-[18px] min-h-[180px] w-full">
        <CardTitleBar title="Assigned Program Evaluations" />
        <div className="mt-[4px] px-[25px] pb-[25px]">
          <DataTable
            caption="Assigned program evaluations"
            columns={EVALUATION_COLUMNS}
            rows={evaluationRows}
            variant="outlined"
          />
        </div>
      </Card>

      <Card className="mt-[20px] min-h-[180px] w-full">
        <CardTitleBar title="Evaluation Progress" />
        <div className="mt-[4px] px-[25px] pb-[25px]">
          <DataTable
            caption="Evaluation progress"
            columns={PROGRESS_COLUMNS}
            rows={progressRows}
            variant="outlined"
          />
        </div>
      </Card>

      <RecentUploads uploads={uploads.list} viewAllHref="/portal/dashboard?uploads=all" layout="full" />

      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <UpcomingSchedule entries={schedule} viewAllHref="/portal/events/schedule" />

        <MiniCalendar
          month={calendar.month}
          today={calendar.today}
          marks={calendar.marks}
          hrefs={calendar.hrefs}
        />
      </div>

      {uploadsOpen && (
        <RecentUploadsDialog entries={uploads.log} closeHref="/portal/dashboard" />
      )}
    </div>
  );
}
