import EventSchedule from "@/components/portal/screens/EventSchedule";
import { getEventSchedule } from "@/lib/events";

/** assets/new frames/EVENTS/Event Schedule.png */
export default async function EventSchedulePage() {
  const rows = await getEventSchedule();
  return <EventSchedule initialRows={rows} />;
}
