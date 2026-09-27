import type { RecentUploads as RecentUploadsData, RepDashboard } from "@/lib/dashboards";
import {
  Card,
  CardTitleBar,
  MiniCalendar,
  type MeetingKind,
  RecentUploads,
  RecentUploadsDialog,
  type ScheduleEntry,
  StatRow,
  StatusBarChart,
  UpcomingSchedule,
} from "../kit";

/**
 * Program Representative dashboard —
 * assets/FIGMA/program_representative/01-Dashboard.png (a 1440x1079 scrolling
 * frame, so it is taller than the 810 viewport).
 *
 * Grid measured off the frame: content 1076 wide, banner 180 tall, then a 104
 * stat row and two 294 rows split 605 / 450 with a 21px gutter, everything 20px
 * apart.
 *
 * Deliberate deviation from the frame: the two card rows are swapped, so
 * Document Status / Recent Uploads sits above Upcoming Schedule / the
 * calendar. Owner's call, not a measurement error.
 *
 * Content padding is 61 left / 53 right — the frame's content group sits 4px
 * right of centre. qac_personnel's dashboard measures exactly 57/57 at the same
 * 1076 width, so this is almost certainly a nudge in the Figma file; it is
 * reproduced rather than normalised, and flagged to the owner.
 *
 * Client revision 2026-09-27 (SYSTEM DESIGN FORMAT): every radius 10, Upcoming
 * Schedule replaced On-Going Program Accreditation beside the calendar.
 */
export default function ProgramRepDashboard({
  data,
  uploads,
  uploadsOpen = false,
  schedule,
  calendar,
}: {
  data: RepDashboard;
  uploads: RecentUploadsData;
  uploadsOpen?: boolean;
  schedule: ScheduleEntry[];
  calendar: {
    month: Date;
    today: number;
    marks: Record<number, MeetingKind>;
    hrefs: Record<number, string>;
  };
}) {
  return (
    <div className="px-[var(--page-gutter)] pb-[47px] pt-[41px] lg:pr-[53px] lg:pl-[61px]">
      <section className="rounded-md bg-maroon px-[26px] py-[20px] text-white shadow-card sm:h-[180px]">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC-WARDS Dashboard!
        </h1>
        <p className="mt-[8px] text-subheading leading-none">
          Here, you can manage, submit, and monitor accreditation documents with
          ease.
        </p>
      </section>

      <div className="mt-[20px]">
        <StatRow stats={data.stats} radius={10} />
      </div>

      {/* Left column flexes, right column stays at the frame's 450 at `lg+` —
          below that both stack full width instead of clipping (09-ui-refactor
          §D.1: 1 column below md, up to 3 at xl). */}
      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <Card radius={10} className="h-[294px] min-w-0 flex-1 overflow-hidden">
          <CardTitleBar title="Document Status Distribution" divider />
          <StatusBarChart bars={data.docStatus} max={data.docStatusMax} />
        </Card>

        <RecentUploads uploads={uploads.list} viewAllHref="/portal/dashboard?uploads=all" radius={10} />
      </div>

      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <UpcomingSchedule entries={schedule} viewAllHref="/portal/events/schedule" radius={10} />

        <MiniCalendar
          month={calendar.month}
          today={calendar.today}
          marks={calendar.marks}
          hrefs={calendar.hrefs}
          radius={10}
        />
      </div>

      {uploadsOpen && (
        <RecentUploadsDialog entries={uploads.log} closeHref="/portal/dashboard" />
      )}
    </div>
  );
}
