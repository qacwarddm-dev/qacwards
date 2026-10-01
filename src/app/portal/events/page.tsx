import EventsScreen from "@/components/portal/screens/EventsScreen";
import { getCalendarEvents } from "@/lib/calendar-events";
import { requireCurrentUser } from "@/lib/current-user";
import { manilaDay, programShort } from "@/lib/program-names";
import { createClient } from "@/lib/supabase/server";
import { getRepEventExtras } from "@/lib/rep-portal";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireCurrentUser();
  const { date } = await searchParams;
  const qac = user.role === "qac_personnel" || user.role === "qac_admin";
  const events = await getCalendarEvents();

  let programs: { id: string; short: string }[] = [];
  if (qac) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("programs(id, name)")
      .in("status", ["in_progress", "submitted", "under_evaluation", "returned"]);
    const seen = new Map<string, string>();
    for (const s of data ?? []) if (s.programs) seen.set(s.programs.id, programShort(s.programs.name));
    programs = [...seen].map(([id, short]) => ({ id, short }));
  }
  const extras = user.role === "program_representative" ? await getRepEventExtras(events) : {};

  return (
    <EventsScreen
      events={events}
      today={manilaDay()}
      initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined}
      canManage={qac}
      programs={programs}
      extras={extras}
    />
  );
}
