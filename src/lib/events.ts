import { createClient } from "@/lib/supabase/server";

/**
 * Reads behind `/portal/events`, `MonthCalendar` and the dashboard `MiniCalendar`s.
 *
 * Which events come back is decided entirely by RLS: an event is visible when its
 * audience includes your role, when it is scoped to a programme you represent, or
 * when it has no audience at all (university-wide). Nothing is filtered here.
 *
 * All times are `timestamptz` and are formatted for **Asia/Manila** on the way
 * out (§8.4) — the server runs UTC, so a date derived without the zone is off by
 * eight hours and lands on the wrong calendar square either side of midnight.
 */
const MANILA = "Asia/Manila";

export type PortalEvent = {
  id: string;
  title: string;
  description: string | null;
  /** `YYYY-MM-DD` in Manila, which is what the calendar grids key on. */
  date: string;
  time: string;
  kind: string;
  cancelled: boolean;
};

/** The Manila calendar date for an instant, as YYYY-MM-DD. `en-CA` is used
 *  because it formats exactly that way without hand-assembling parts. */
function manilaDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: MANILA });
}

function manilaTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", {
    timeZone: MANILA,
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function getEvents(from: Date, to: Date): Promise<PortalEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, description, start_time, kind, cancelled_at")
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time");

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: manilaDate(e.start_time),
    time: manilaTime(e.start_time),
    kind: e.kind,
    cancelled: e.cancelled_at !== null,
  }));
}

/** The events in one calendar month, Manila-aligned. */
export async function getMonthEvents(year: number, month: number) {
  // month is 1-based. Widened by a day either side so an event near midnight
  // Manila is not dropped by the UTC boundaries of the range.
  const from = new Date(Date.UTC(year, month - 1, 0));
  const to = new Date(Date.UTC(year, month, 1, 23, 59, 59));
  const events = await getEvents(from, to);

  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return events.filter((e) => e.date.startsWith(prefix));
}

export async function getUpcomingEvents(limit = 5): Promise<PortalEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, description, start_time, kind, cancelled_at")
    .gte("start_time", new Date().toISOString())
    .is("cancelled_at", null)
    .order("start_time")
    .limit(limit);

  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: manilaDate(e.start_time),
    time: manilaTime(e.start_time),
    kind: e.kind,
    cancelled: false,
  }));
}
