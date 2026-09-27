import Card from "./Card";
import CardTitleBar from "./CardTitleBar";
import DataTable, { type Column } from "./DataTable";
import ViewAllLink from "./ViewAllLink";

export type ScheduleEntry = {
  id: string;
  date: string;
  title: string;
  program: string;
  collegeCampus: string;
};

const COLUMNS: Column[] = [
  { key: "date", header: "Date", width: "w-[160px]" },
  { key: "title", header: "Event Title", width: "w-[180px]" },
  { key: "program", header: "Program", width: "flex-1", align: "left" },
];

/** Dashboard "Upcoming Schedule" card, paired with `MiniCalendar` on every role's dashboard. */
export default function UpcomingSchedule({
  entries,
  viewAllHref,
  radius = 20,
}: {
  entries: ScheduleEntry[];
  viewAllHref?: string;
  radius?: 10 | 20;
}) {
  const rows = entries.map((s) => ({
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
    <Card radius={radius} className="min-h-[294px] min-w-0 flex-1">
      <CardTitleBar
        title="Upcoming Schedule"
        action={viewAllHref && <ViewAllLink href={viewAllHref} />}
      />
      <div className="mt-[4px] px-[25px] pb-[25px]">
        <DataTable
          caption="Upcoming schedule"
          columns={COLUMNS}
          rows={rows}
          variant="outlined"
          bodyRowH="py-[14px]"
          empty={<p className="py-[16px] text-center text-regular text-gray">No upcoming events.</p>}
        />
      </div>
    </Card>
  );
}
