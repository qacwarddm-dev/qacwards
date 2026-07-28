import { EVENT_MARKS, EVENT_MONTH, EVENT_TITLES } from "@/components/portal/data";
import { CalendarLegend, Card, MonthCalendar } from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/04-Events.png */
export default function EventsPage() {
  return (
    <div className="px-[57px] pt-[45px] pb-[45px]">
      <Card className="flex gap-[32px] px-[32px] pb-[52px] pt-[52px]">
        <div className="w-[175px] shrink-0">
          <h1 className="text-heading font-semibold leading-none text-black">
            Events
          </h1>
          <div className="mt-[56px]">
            <CalendarLegend />
          </div>
        </div>

        <MonthCalendar month={EVENT_MONTH} marks={EVENT_MARKS} events={EVENT_TITLES} />
      </Card>
    </div>
  );
}
