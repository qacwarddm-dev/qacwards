import { History } from "lucide-react";
import { getActivity } from "@/lib/activity";
import { requireCurrentUser } from "@/lib/current-user";
import { Card, DataTable, EmptyState, SectionHeading } from "@/components/portal/kit";

/**
 * `/portal/activity` — the audit trail.
 *
 * Scope is decision 17: your own actions, and everyone's if you are QAC Admin.
 * There is no role check on this page and no actor filter in the query — two RLS
 * policies on `activity_logs` decide it, and a check here could only ever
 * disagree with them. A representative therefore sees a page with their own
 * history in it rather than a 404, which is correct: it is their history.
 *
 * Rows come from Postgres triggers on every mutating table (§2.5), so coverage
 * does not depend on a route handler remembering to log.
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; id?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  const cursor =
    params.before && params.id
      ? { createdAt: params.before, id: params.id }
      : undefined;

  const { rows, next } = await getActivity(cursor);
  const isAdmin = user.role === "qac_admin";

  return (
    <div className="px-[81px] pt-[19px] pb-[16px]">
      <Card className="px-[28px] pt-[19px] pb-[22px]">
        <SectionHeading icon={History}>
          {isAdmin ? "SYSTEM ACTIVITY" : "MY ACTIVITY"}
        </SectionHeading>

        {rows.length === 0 ? (
          <EmptyState message="No activity recorded yet." />
        ) : (
          <DataTable
            columns={[
              { key: "at", header: "When", width: "w-[190px]", align: "left" },
              ...(isAdmin
                ? [{ key: "actor", header: "Who", width: "w-[200px]", align: "left" as const }]
                : []),
              { key: "action", header: "Action", width: "w-[110px]" },
              { key: "target", header: "Record", width: "w-[190px]", align: "left" },
              { key: "detail", header: "Change", align: "left" },
            ]}
            rows={rows.map((r) => ({
              id: r.id,
              cells: {
                at: r.at,
                actor: r.actorName,
                action: r.action,
                target: r.target,
                // The diff is the only free-form cell, so it is the one that has
                // to be allowed to truncate rather than push the table wide.
                detail: (
                  <span className="block truncate text-left" title={r.detail ?? ""}>
                    {r.detail ?? "—"}
                  </span>
                ),
              },
            }))}
            // Keyset, not offset (§8.3): the cursor is the last row's own sort
            // key, so a page boundary cannot shift under an insert the way an
            // offset does on a table that only ever grows.
            pagination={{
              prevHref: cursor ? "/portal/activity" : undefined,
              prevLabel: "Back to the latest",
              nextHref: next
                ? `/portal/activity?before=${encodeURIComponent(next.createdAt)}&id=${next.id}`
                : undefined,
              nextLabel: "Load older activity",
            }}
          />
        )}
      </Card>
    </div>
  );
}
