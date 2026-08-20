import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind `/portal/activity`.
 *
 * Scope is decision 17 — own actions only, QAC Admin sees all — and it is
 * enforced by two RLS policies, not here. This file passes no actor filter at
 * all, so what comes back is whatever the caller is allowed to see. Filtering in
 * the query as well would mean the page and the policy could drift apart, and
 * the page would be the one people trusted.
 *
 * Keyset-paginated on `(created_at desc, id desc)` per §8.3: `activity_logs` is
 * the one table in this schema that grows without bound, which is exactly where
 * OFFSET degrades.
 */

const PAGE = 40;

export type ActivityRow = {
  id: string;
  actorName: string;
  action: string;
  target: string;
  detail: string | null;
  ip: string | null;
  at: string;
  createdAt: string;
};

export type ActivityPage = {
  rows: ActivityRow[];
  /** Cursor for the next page, or null at the end. */
  next: { createdAt: string; id: string } | null;
};

const MANILA = "Asia/Manila";

function manilaStamp(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: MANILA,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** `submission_documents` → `Submission documents`. The log stores the table
 *  name because that is what the trigger knows; a person should not have to. */
function humanTable(table: string): string {
  const s = table.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ACTION_LABELS: Record<string, string> = {
  insert: "Created",
  update: "Updated",
  delete: "Deleted",
};

/**
 * The one field worth showing from a jsonb diff without rendering the whole row:
 * what actually changed. Everything else is available to an admin through the
 * database, and dumping it into a table cell would make the page unreadable.
 */
function changedSummary(
  oldValue: unknown,
  newValue: unknown,
): string | null {
  if (!newValue || typeof newValue !== "object") return null;
  if (!oldValue || typeof oldValue !== "object") return null;

  const before = oldValue as Record<string, unknown>;
  const after = newValue as Record<string, unknown>;

  const changed = Object.keys(after).filter(
    (k) =>
      k !== "updated_at" &&
      JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  );

  if (changed.length === 0) return null;

  return changed
    .slice(0, 3)
    .map((k) => `${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(after[k])}`)
    .join(", ");
}

export async function getActivity(cursor?: {
  createdAt: string;
  id: string;
}): Promise<ActivityPage> {
  const supabase = await createClient();

  let query = supabase
    .from("activity_logs")
    .select(
      "id, action_type, target_table, target_id, old_value, new_value, ip_address, created_at, actor:actor_id (surname, given_name)",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    // One extra row is fetched to answer "is there a next page" without a
    // second count query against an unbounded table.
    .limit(PAGE + 1);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
    );
  }

  const { data } = await query;
  const all = data ?? [];
  const rows = all.slice(0, PAGE);
  const last = rows[rows.length - 1];

  return {
    rows: rows.map((r) => ({
      id: r.id,
      actorName: r.actor
        ? `${r.actor.surname}, ${r.actor.given_name}`
        : // Null actor is the seed, a migration or a trigger cascade, not a
          // person. Naming it beats an empty cell that reads like a bug.
          "System",
      action: ACTION_LABELS[r.action_type] ?? r.action_type,
      target: humanTable(r.target_table),
      detail: changedSummary(r.old_value, r.new_value),
      // ip_address is `inet` in Postgres; PostgREST serialises it as text but
      // the generator can't express that, so it comes back `unknown`.
      ip: r.ip_address as string | null,
      at: manilaStamp(r.created_at),
      createdAt: r.created_at,
    })),
    next:
      all.length > PAGE && last
        ? { createdAt: last.created_at, id: last.id }
        : null,
  };
}
