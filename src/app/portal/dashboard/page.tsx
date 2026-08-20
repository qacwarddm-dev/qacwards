import InternalAccreditorDashboard from "@/components/portal/screens/InternalAccreditorDashboard";
import ProgramRepDashboard from "@/components/portal/screens/ProgramRepDashboard";
import QacPersonnelDashboard from "@/components/portal/screens/QacPersonnelDashboard";
import {
  getIaDashboard,
  getMiniCalendarData,
  getQacDashboard,
  getRepDashboard,
  getUpcomingSchedule,
} from "@/lib/dashboards";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * One URL, role-appropriate content. Every role's sidebar links to
 * `/portal/dashboard` in its own frames, so the route is shared and the screen
 * is chosen by the identity seam rather than by the path.
 *
 * Screens live in `components/portal/screens/` and are presentational — this
 * is the fetching half (B9), same split as `/portal/submission`.
 */
export default async function DashboardPage() {
  const user = await requireCurrentUser();

  if (user.role === "program_representative") {
    const [data, calendar] = await Promise.all([getRepDashboard(), getMiniCalendarData()]);
    return <ProgramRepDashboard data={data} calendar={calendar} />;
  }

  if (user.role === "internal_accreditor") {
    const [data, schedule, calendar] = await Promise.all([
      getIaDashboard(user.id),
      getUpcomingSchedule(),
      getMiniCalendarData(),
    ]);
    return <InternalAccreditorDashboard data={data} schedule={schedule} calendar={calendar} />;
  }

  const data = await getQacDashboard();
  return <QacPersonnelDashboard data={data} />;
}
