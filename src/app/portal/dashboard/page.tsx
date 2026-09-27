import InternalAccreditorDashboard from "@/components/portal/screens/InternalAccreditorDashboard";
import ProgramRepDashboard from "@/components/portal/screens/ProgramRepDashboard";
import QacPersonnelDashboard from "@/components/portal/screens/QacPersonnelDashboard";
import {
  getEvaluationProgressAll,
  getIaDashboard,
  getMiniCalendarData,
  getOngoingAccreditations,
  getQacDashboard,
  getRecentUploads,
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
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ uploads?: string }>;
}) {
  const user = await requireCurrentUser();
  const uploadsOpen = (await searchParams).uploads === "all";

  if (user.role === "program_representative") {
    const [data, uploads, schedule, calendar] = await Promise.all([
      getRepDashboard(),
      getRecentUploads({ withRepLinks: true }),
      getUpcomingSchedule(),
      getMiniCalendarData(),
    ]);
    return (
      <ProgramRepDashboard
        data={data}
        uploads={uploads}
        uploadsOpen={uploadsOpen}
        schedule={schedule}
        calendar={calendar}
      />
    );
  }

  if (user.role === "internal_accreditor") {
    const [data, schedule, uploads, calendar] = await Promise.all([
      getIaDashboard(user.id),
      getUpcomingSchedule(),
      getRecentUploads(),
      getMiniCalendarData(),
    ]);
    return (
      <InternalAccreditorDashboard
        data={data}
        schedule={schedule}
        uploads={uploads}
        uploadsOpen={uploadsOpen}
        calendar={calendar}
      />
    );
  }

  const [data, ongoing, evaluationProgress, schedule, uploads, calendar] = await Promise.all([
    getQacDashboard(),
    getOngoingAccreditations(),
    getEvaluationProgressAll(),
    getUpcomingSchedule(),
    getRecentUploads(),
    getMiniCalendarData(),
  ]);
  return (
    <QacPersonnelDashboard
      data={data}
      ongoing={ongoing}
      evaluationProgress={evaluationProgress}
      schedule={schedule}
      uploads={uploads}
      uploadsOpen={uploadsOpen}
      calendar={calendar}
    />
  );
}
