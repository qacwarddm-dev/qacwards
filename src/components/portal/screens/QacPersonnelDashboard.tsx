import CopcChart from "@/components/portal/CopcChart";
import type { EvaluationProgressRow, OngoingAccreditation } from "@/lib/dashboards";
import {
  Card,
  CardTitleBar,
  type Column,
  DataTable,
  MiniCalendar,
  type MeetingKind,
  StatRow,
  type Stat,
} from "@/components/portal/kit";

/**
 * QAC Personnel dashboard — assets/FIGMA/qac_personnel/01-Dashboard.png, plus
 * the 2026-09 client revision (assets/new frames/QAC/new.png) that adds three
 * cards below the chart: on-going accreditation, evaluation progress, and an
 * upcoming-schedule table paired with the same `MiniCalendar` the Internal
 * Accreditor dashboard uses. Table/card composition below the chart mirrors
 * `InternalAccreditorDashboard` deliberately — same client revision, same
 * layout language.
 *
 * B9 made this the presentational half: `data` comes from
 * `getQacDashboard()` (`src/lib/dashboards.ts`), read by
 * `/portal/dashboard/page.tsx`. Also rendered for `qac_admin`, which has no
 * dashboard frames of its own and shares this one.
 */
const ONGOING_COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "accreditor", header: "Assigned Accreditor", width: "w-[220px]" },
];

const PROGRESS_COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "readiness", header: "Readiness", width: "w-[240px]" },
];

const SCHEDULE_COLUMNS: Column[] = [
  { key: "date", header: "Date", width: "w-[160px]" },
  { key: "title", header: "Event Title", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1", align: "left" },
];

export default function QacPersonnelDashboard({
  data,
  ongoing,
  evaluationProgress,
  schedule,
  calendar,
}: {
  data: { stats: Stat[]; copcSeries: number[] };
  ongoing: OngoingAccreditation[];
  evaluationProgress: EvaluationProgressRow[];
  schedule: { id: string; date: string; title: string; program: string; collegeCampus: string }[];
  calendar: { month: Date; today: number; marks: Record<number, MeetingKind> };
}) {
  const ongoingRows = ongoing.map((a) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      accreditor: a.accreditor,
    },
  }));

  const progressRows = evaluationProgress.map((p) => ({
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

  const scheduleRows = schedule.map((s) => ({
    id: s.id,
    cells: {
      date: s.date,
      title: <span className="whitespace-normal">{s.title}</span>,
      program: (
        <span className="block whitespace-normal">
          {s.program}
          <span className="block text-regular italic leading-none text-gray">
            {s.collegeCampus}
          </span>
        </span>
      ),
    },
  }));

  return (
    <div className="px-[var(--page-gutter)] pb-[86px] pt-[45px] lg:px-[57px]">
      <section className="rounded-lg bg-maroon px-[26px] py-[20px] text-white shadow-card sm:h-[180px]">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC Dashboard!
        </h1>
        <p className="-mt-px text-subheading leading-none">
          Here, you can oversee, organize, and manage the entire accreditation
          process seamlessly.
        </p>
      </section>

      <div className="mt-[25px]">
        <StatRow stats={data.stats} />
      </div>

      <section className="relative mt-[26px] h-[320px] rounded-lg bg-white shadow-card">
        <h2 className="absolute left-[24px] top-[28px] text-subheading font-semibold leading-[22px] text-maroon">
          Overall Program
          <br />
          With Issued COPCs
        </h2>
        <CopcChart series={data.copcSeries} />
      </section>

      <Card className="mt-[18px] min-h-[180px] w-full">
        <CardTitleBar title="On-Going Program Accreditation" />
        <div className="mt-[4px] px-[25px] pb-[25px]">
          <DataTable
            caption="On-going program accreditation"
            columns={ONGOING_COLUMNS}
            rows={ongoingRows}
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

      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <Card className="min-h-[294px] min-w-0 flex-1">
          <CardTitleBar title="Upcoming Schedule" />
          <div className="mt-[4px] px-[25px] pb-[25px]">
            <DataTable
              caption="Upcoming schedule"
              columns={SCHEDULE_COLUMNS}
              rows={scheduleRows}
              variant="outlined"
              bodyRowH="py-[14px]"
            />
          </div>
        </Card>

        <MiniCalendar month={calendar.month} today={calendar.today} marks={calendar.marks} />
      </div>
    </div>
  );
}
