import RepDashboard from "@/components/portal/screens/rep/RepDashboard";
import { getRepPrograms } from "@/lib/rep-portal";
import { getCompletedVisits } from "@/lib/visit-evaluations";
import IaDashboard from "@/components/portal/screens/ia/IaDashboard";
import QacDashboard from "@/components/portal/screens/qac/QacDashboard";
import { getCalendarEvents } from "@/lib/calendar-events";
import { greeting, greetName } from "@/lib/greeting";
import { getIaAssignments } from "@/lib/ia-portal";
import { getNdaQueue, getQacOverview, getSystemStatus } from "@/lib/qac-portal";
import { manilaDay } from "@/lib/program-names";
import { requireCurrentUser } from "@/lib/current-user";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const hello = `${greeting()}, ${greetName(user.name, user.position)}`;
  const today = manilaDay();

  if (user.role === "program_representative") {
    const [programs, events, visits] = await Promise.all([getRepPrograms(), getCalendarEvents(), getCompletedVisits()]);
    return <RepDashboard hello={hello} programs={programs} events={events} today={today} visits={visits} />;
  }

  if (user.role === "internal_accreditor") {
    const [assignments, events] = await Promise.all([getIaAssignments(user.id), getCalendarEvents()]);
    return <IaDashboard hello={hello} assignments={assignments.filter((a) => a.myResponse === "accepted")} events={events} today={today} />;
  }

  const [{ programs, totals }, ndas, events, system] = await Promise.all([
    getQacOverview(),
    getNdaQueue(),
    getCalendarEvents(),
    user.role === "qac_admin" ? getSystemStatus() : Promise.resolve(null),
  ]);
  const asOf = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "Asia/Manila" });
  return <QacDashboard hello={hello} programs={programs} totals={totals} ndas={ndas} events={events} today={today} asOf={asOf} system={system} />;
}
