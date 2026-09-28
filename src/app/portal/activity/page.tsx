import ActivityLog from "@/components/portal/screens/ActivityLog";
import { getActivityFeed, parseActivityFilter } from "@/lib/activity";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * `/portal/activity` — the audit trail, written as sentences
 * (profile-activity-mockup.html, 2026-09-28).
 *
 * Scope is decision 17: your own actions, and everyone's if you are QAC Admin.
 * There is no role check on this page and no actor filter in the query — two RLS
 * policies on `activity_logs` decide it, and a check here could only ever
 * disagree with them.
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireCurrentUser();
  const filter = parseActivityFilter((await searchParams).filter);
  const feed = await getActivityFeed(filter, user.role);

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[19px] lg:px-[81px]">
      <h1 className="sr-only">Activity</h1>
      <ActivityLog
        key={filter}
        heading={user.role === "qac_admin" ? "SYSTEM ACTIVITY" : "MY ACTIVITY"}
        filter={filter}
        initial={feed}
      />
    </div>
  );
}
