import { createClient } from "@/lib/supabase/server";
import { BUCKETS, signedUrl } from "@/lib/storage";
import type { StatusKey } from "@/components/portal/kit";

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

const AVATAR_FALLBACK = "/assets/portal/avatar-placeholder.png";

export type ScheduleParticipant = { id: string; name: string; avatar: string };

export type ScheduleEvent = {
  id: string;
  /** ISO instant — the table formats and sorts off this, never a pre-formatted string. */
  sortKey: string;
  date: string;
  title: string;
  program: string;
  /** "COLLEGE - Campus, City", or "—" for a university-wide event with no
   *  linked programme (§ getUpcomingSchedule's format, reused so the same
   *  event reads identically on the dashboard and here). */
  collegeCampus: string;
  /** Plain campus name for the Campus filter — `collegeCampus`'s compound
   *  string would make for a useless dropdown. */
  campus: string;
  status: StatusKey;
  participants: ScheduleParticipant[];
};

/** Time-derived, not a workflow state — a `meeting`/`survey_visit` compares
 *  `now` against its start/end window; a deadline (no window, just a date)
 *  is only ever upcoming or completed, never "ongoing". */
function computeScheduleStatus(start: string, end: string | null, now: Date): StatusKey {
  const startsAt = new Date(start);
  const endsAt = end ? new Date(end) : startsAt;
  if (now < startsAt) return "upcoming";
  if (now > endsAt) return "completed";
  return "ongoing";
}

function manilaLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: MANILA,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function resolveAvatar(supabase: Awaited<ReturnType<typeof createClient>>, path: string | null) {
  if (!path) return AVATAR_FALLBACK;
  const signed = await signedUrl(supabase, BUCKETS.avatars, path);
  return signed.data ?? AVATAR_FALLBACK;
}

/**
 * The merged Calendar/Event Schedule list — same two sources `getEvents` reads
 * (`events`, plus per-assignment `due_date`s), enriched with what the Event
 * Schedule table shows that the calendar day-grid doesn't need: a status
 * derived from time rather than stored, a programme, and — for a deadline
 * row only, since that's the one case with a real assigned team — the
 * accreditors on that assignment as participant avatars. A plain `events` row
 * has no participant concept in the schema (no attendee list anywhere), so it
 * renders with none rather than inventing one — same call Reports made for
 * its empty report list (Decision 18, O-7).
 */
export async function getEventSchedule(): Promise<ScheduleEvent[]> {
  const supabase = await createClient();
  const now = new Date();

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, start_time, end_time, event_programs(programs(name, campuses(name), colleges(code)))",
    )
    .is("cancelled_at", null)
    .order("start_time");

  const eventRows: ScheduleEvent[] = (events ?? []).map((e) => {
    const first = e.event_programs?.[0]?.programs ?? null;
    return {
      id: e.id,
      sortKey: e.start_time,
      date: manilaLongDate(e.start_time),
      title: e.title,
      program: first?.name ?? "University-wide",
      collegeCampus: first ? `${first.colleges?.code ?? "—"} - ${first.campuses?.name ?? "—"}` : "—",
      campus: first?.campuses?.name ?? "—",
      status: computeScheduleStatus(e.start_time, e.end_time, now),
      participants: [],
    };
  });

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, due_date,
       submissions(is_revalidation, programs(name, campuses(name), colleges(code)), accreditation_levels(name)),
       assignment_accreditors(profile_id, profiles(surname, given_name, avatar_path))`,
    )
    .not("due_date", "is", null)
    .order("due_date");

  const deadlineRows: ScheduleEvent[] = await Promise.all(
    (assignments ?? []).map(async (a) => {
      // `assignment_id` -> `submission_id` is unique (round 2 §2: "Reassign
      // REPLACES team on same assignment"), so this join is 1:1 — a plain
      // object, same as `getAssignments()` (assignments.ts) reads it.
      const submission = a.submissions;
      const program = submission?.programs;
      const level = submission?.accreditation_levels;
      const kind = submission?.is_revalidation ? "Re-Accreditation" : "Initial Accreditation";

      const participants = await Promise.all(
        (a.assignment_accreditors ?? []).map(async (m) => ({
          id: m.profile_id,
          name: m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : "—",
          avatar: await resolveAvatar(supabase, m.profiles?.avatar_path ?? null),
        })),
      );

      const dueDate = a.due_date as string;
      return {
        id: `assignment-deadline:${a.id}`,
        sortKey: dueDate,
        // `due_date` is a plain DATE, not timestamptz — parsed as UTC
        // midnight, +8h to Manila never rolls it back a day, so no zone
        // conversion is needed the way a real instant would require.
        date: manilaLongDate(dueDate),
        title: `${kind} for ${level?.name ?? "Accreditation"}`,
        program: program?.name ?? "Assignment",
        collegeCampus: program ? `${program.colleges?.code ?? "—"} - ${program.campuses?.name ?? "—"}` : "—",
        campus: program?.campuses?.name ?? "—",
        status: manilaDate(new Date().toISOString()) > dueDate ? "completed" : "upcoming",
        participants,
      };
    }),
  );

  return [...eventRows, ...deadlineRows].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
