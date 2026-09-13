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

/** Converts a `datetime-local` wall-clock string (no zone) into a UTC ISO
 *  instant, hard-pinned to Manila's fixed UTC+8 (no DST, ever) rather than
 *  whatever zone the server process happens to run in (O-20). */
export function manilaWallClockToUtcIso(wallClock: string): string {
  const withSeconds = wallClock.length === 16 ? `${wallClock}:00` : wallClock;
  return new Date(`${withSeconds}+08:00`).toISOString();
}

export async function getEvents(from: Date, to: Date): Promise<PortalEvent[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, title, description, start_time, kind, cancelled_at")
    .gte("start_time", from.toISOString())
    .lte("start_time", to.toISOString())
    .order("start_time");

  const rows = (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: manilaDate(e.start_time),
    time: manilaTime(e.start_time),
    kind: e.kind,
    cancelled: e.cancelled_at !== null,
  }));

  const deadlines = await getAssignmentDeadlineEvents(from, to);
  return [...rows, ...deadlines].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * QAC's per-assignment deadline (`assignments.due_date`) surfaced on the same
 * calendar as `events` rather than requiring QAC to separately create a
 * calendar entry for it (client's call, 2026-09-06). RLS on `assignments`
 * already limits these to the rows the viewer can see.
 */
async function getAssignmentDeadlineEvents(from: Date, to: Date): Promise<PortalEvent[]> {
  const supabase = await createClient();

  const fromDate = manilaDate(from.toISOString());
  const toDate = manilaDate(to.toISOString());

  const { data } = await supabase
    .from("assignments")
    .select("id, due_date, submissions(programs(name), accreditation_levels(name))")
    .not("due_date", "is", null)
    .gte("due_date", fromDate)
    .lte("due_date", toDate);

  return (data ?? []).map((a) => {
    const submission = Array.isArray(a.submissions) ? a.submissions[0] : a.submissions;
    const program = Array.isArray(submission?.programs)
      ? submission?.programs[0]
      : submission?.programs;
    const level = Array.isArray(submission?.accreditation_levels)
      ? submission?.accreditation_levels[0]
      : submission?.accreditation_levels;

    return {
      id: `assignment-deadline:${a.id}`,
      title: `Deadline — ${program?.name ?? "Assignment"}${level?.name ? ` (${level.name})` : ""}`,
      description: null,
      date: a.due_date as string,
      time: "",
      kind: "deadline",
      cancelled: false,
    };
  });
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

  const rows = (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: manilaDate(e.start_time),
    time: manilaTime(e.start_time),
    kind: e.kind,
    cancelled: false,
  }));

  const now = new Date();
  const farOut = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365);
  const deadlines = await getAssignmentDeadlineEvents(now, farOut);

  return [...rows, ...deadlines]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}
