import EventsCalendar from "@/components/portal/screens/EventsCalendar";
import { getMonthEvents } from "@/lib/events";

/** assets/FIGMA/qac_personnel/04-Events.png */
export default async function EventsPage() {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const events = await getMonthEvents(now.getFullYear(), now.getMonth() + 1);

  return <EventsCalendar initialMonth={month} initialEvents={events} />;
}
