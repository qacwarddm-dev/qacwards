import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  PR_CALENDAR_MARKS,
  PR_CALENDAR_MONTH,
  PR_CALENDAR_TODAY,
  PR_DASHBOARD_STATS,
  PR_DOC_STATUS,
  PR_ONGOING_ACCREDITATION,
  PR_RECENT_UPLOADS,
} from "../data";
import {
  Card,
  CardTitleBar,
  DataTable,
  MiniCalendar,
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

export default function ProgramRepDashboard() {
  const rows = PR_ONGOING_ACCREDITATION.map((a) => ({
    id: a.id,
    cells: {
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      accreditor: a.accreditor,
    },
  }));

  return (
    <div className="pt-[41px] pr-[53px] pb-[47px] pl-[61px]">
      <section className="h-[180px] rounded-lg bg-maroon px-[26px] pt-[20px] text-white shadow-card">
        <h1 className="text-banner font-semibold leading-[36px]">
          Welcome to the QAC-WARDS Dashboard!
        </h1>
        <p className="mt-[8px] text-subheading leading-none">
          Here, you can manage, submit, and monitor accreditation documents with
          ease.
        </p>
      </section>

      <div className="mt-[20px]">
        <StatRow stats={PR_DASHBOARD_STATS} />
      </div>

      {/* Left column flexes, right column stays at the frame's 450 — so the pair
          fills the content box and the calendar's right edge lands on the same
          line as the stat row and banner above it, at any window width. The
          frame's 605 is what flex-1 resolves to at exactly 1440. */}
      <div className="mt-[20px] flex gap-[21px]">
        <Card className="h-[294px] min-w-0 flex-1">
          <CardTitleBar title="On-Going Program Accreditation" />
          {/* Header is 54; the frame puts the table's grey band at 58. */}
          <div className="mt-[4px] px-[25px]">
            <DataTable columns={COLUMNS} rows={rows} variant="outlined" />
          </div>
        </Card>

        <MiniCalendar
          month={PR_CALENDAR_MONTH}
          today={PR_CALENDAR_TODAY}
          marks={PR_CALENDAR_MARKS}
        />
      </div>

      <div className="mt-[20px] flex gap-[21px]">
        <Card className="h-[294px] min-w-0 flex-1 overflow-hidden">
          <CardTitleBar title="Document Status Distribution" divider />
          <StatusBarChart bars={PR_DOC_STATUS} />
        </Card>

        <Card className="flex h-[294px] w-[450px] flex-col overflow-hidden">
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
          <UploadList uploads={PR_RECENT_UPLOADS} />
        </Card>
      </div>
    </div>
  );
}
