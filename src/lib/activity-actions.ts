"use server";

import { requireCurrentUser } from "@/lib/current-user";
import {
  getActivityFeed,
  parseActivityFilter,
  type ActivityCursor,
  type ActivityFeed,
} from "@/lib/activity";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadOlderActivity(filter: string, cursor: ActivityCursor): Promise<ActivityFeed> {
  // The cursor is spliced into a PostgREST `or=` filter string, so it must be
  // exactly a uuid and a timestamp, never free text.
  if (!UUID.test(cursor.id) || Number.isNaN(Date.parse(cursor.createdAt)) || /[,()]/.test(cursor.createdAt)) {
    return { entries: [], next: null };
  }
  const user = await requireCurrentUser();
  return getActivityFeed(parseActivityFilter(filter), user.role, cursor);
}
