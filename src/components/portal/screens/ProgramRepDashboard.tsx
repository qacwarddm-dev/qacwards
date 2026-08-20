import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { RepDashboard } from "@/lib/dashboards";
import {
  Card,
  CardTitleBar,
  DataTable,
  MiniCalendar,
  type MeetingKind,
  StatRow,
  StatusBarChart,
  UploadList,
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
 * Document Status / Recent Uploads sits above On-Going Accreditation / the
 * calendar. Owner's call, not a measurement error.
 *
 * Content padding is 61 left / 53 right — the frame's content group sits 4px
 * right of centre. qac_personnel's dashboard measures exactly 57/57 at the same
 * 1076 width, so this is almost certainly a nudge in the Figma file; it is
 * reproduced rather than normalised, and flagged to the owner.
 */
/** Widths back-solved from the frame's column centres (147.25 / 326 / 447.25
 *  measured from the table's left edge, table 555 wide). */
const COLUMNS = [
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[63px]" },
  { key: "accreditor", header: "Assigned Accreditor", width: "w-[198px]" },
];

export default function ProgramRepDashboard({
  data,
  calendar,
}: {
  data: RepDashboard;
  calendar: { month: Date; today: number; marks: Record<number, MeetingKind> };
}) {
  const rows = data.ongoing.map((a) => ({
    id: a.id,
    cells: {
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      accreditor: a.accreditor,
    },
  }));

  return (
    <div className="px-[var(--page-gutter)] pb-[47px] pt-[41px] lg:pr-[53px] lg:pl-[61px]">
      <section className="rounded-lg bg-maroon px-[26px] py-[20px] text-white shadow-card sm:h-[180px]">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC-WARDS Dashboard!
        </h1>
        <p className="mt-[8px] text-subheading leading-none">
          Here, you can manage, submit, and monitor accreditation documents with
          ease.
        </p>
      </section>

      <div className="mt-[20px]">
        <StatRow stats={data.stats} />
      </div>

      {/* Left column flexes, right column stays at the frame's 450 at `lg+` —
          below that both stack full width instead of clipping (09-ui-refactor
          §D.1: 1 column below md, up to 3 at xl). */}
      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <Card className="h-[294px] min-w-0 flex-1 overflow-hidden">
          <CardTitleBar title="Document Status Distribution" divider />
          <StatusBarChart bars={data.docStatus} max={data.docStatusMax} />
        </Card>

        <Card className="flex h-[294px] w-full flex-col overflow-hidden lg:w-[450px]">
          <CardTitleBar
            title="Recent Uploads"
            divider
            action={
              <Link
                href="/portal/documents"
                className="flex items-center gap-[4px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
              >
                View All
                <ChevronRight className="h-[14px] w-[14px]" strokeWidth={2.5} aria-hidden />
              </Link>
            }
          />
          <UploadList uploads={data.recentUploads} />
        </Card>
      </div>

      <div className="mt-[20px] flex flex-col gap-[21px] lg:flex-row">
        <Card className="h-[294px] min-w-0 flex-1">
          <CardTitleBar title="On-Going Program Accreditation" />
          {/* Header is 54; the frame puts the table's grey band at 58. */}
          <div className="mt-[4px] px-[25px]">
            <DataTable
              caption="Ongoing program accreditation"
              columns={COLUMNS}
              rows={rows}
              variant="outlined"
            />
          </div>
        </Card>

        <MiniCalendar month={calendar.month} today={calendar.today} marks={calendar.marks} />
      </div>
    </div>
  );
}
