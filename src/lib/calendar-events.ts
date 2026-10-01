import { createClient } from "@/lib/supabase/server";
import { manilaDay, programShort } from "@/lib/program-names";
import type { CalEvent, CalType } from "@/components/portal/kit/calendar";

const KIND: Record<string, CalType> = {
  meeting: "meet",
  survey_visit: "visit",
  deadline: "dead",
  holiday: "hol",
  other: "meet",
};

const ROLE: Record<string, string> = {
  program_representative: "Program reps",
  internal_accreditor: "Internal accreditors",
  qac_personnel: "QAC",
  qac_admin: "QAC",
};

function timeOf(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function timeRange(start: string, end: string | null, kind: string) {
  if (kind === "holiday") return "Whole day";
  const s = timeOf(start);
  if (!end) return s === "12:00 AM" ? "Whole day" : s;
  const e = timeOf(end);
  return `${s} – ${e}`;
}

export async function getCalendarEvents(): Promise<CalEvent[]> {
  const supabase = await createClient();
  const now = new Date();
  const from = new Date(now.getTime() - 120 * 864e5).toISOString();
  const to = new Date(now.getTime() + 240 * 864e5).toISOString();

  const [{ data: events }, { data: assignments }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, start_time, end_time, kind, created_by, event_programs(programs(name)), event_audiences(role)")
      .is("cancelled_at", null)
      .gte("start_time", from)
      .lte("start_time", to)
      .order("start_time"),
    supabase
      .from("assignments")
      .select(
        `id, due_date, site_visit_date,
         submissions(programs(name, colleges(code), campuses(name)), accreditation_levels(name, code)),
         assignment_accreditors(response, profiles(surname, given_name))`,
      )
      .or("due_date.not.is.null,site_visit_date.not.is.null"),
  ]);

  const out: CalEvent[] = [];
  for (const e of events ?? []) {
    if (e.title.startsWith("__T")) continue;
    const progs = (e.event_programs ?? []).map((p) => (p.programs ? programShort(p.programs.name) : null)).filter(Boolean);
    const roles = [...new Set((e.event_audiences ?? []).map((a) => ROLE[a.role]).filter(Boolean))];
    const startDay = manilaDay(e.start_time);
    const endDay = e.end_time ? manilaDay(e.end_time) : startDay;
    const loc = (e as { location?: string | null }).location;
    out.push({
      id: e.id,
      title: e.title,
      type: KIND[e.kind] ?? "meet",
      start: startDay,
      end: endDay !== startDay ? endDay : undefined,
      time: timeRange(e.start_time, e.end_time, e.kind),
      where: loc || e.description || (e.kind === "holiday" ? "No classes / offices closed" : "—"),
      prog: progs.length ? progs.join(", ") : e.kind === "holiday" ? "University-wide" : "All",
      part: roles.length ? roles.join(", ") : "—",
      removable: true,
    });
  }

  for (const a of assignments ?? []) {
    const s = a.submissions;
    const short = programShort(s?.programs?.name ?? "");
    const lvl = s?.accreditation_levels?.name ?? "Accreditation";
    const team = (a.assignment_accreditors ?? [])
      .filter((m) => m.response !== "rejected" && m.profiles)
      .map((m) => `${m.profiles!.surname}, ${m.profiles!.given_name[0]}.`);
    const where = [s?.programs?.colleges?.code, s?.programs?.campuses?.name].filter(Boolean).join(" · ") || "—";
    if (a.site_visit_date) {
      out.push({
        id: `visit:${a.id}`,
        title: s?.accreditation_levels?.code === "PSV" ? `PSV · ${short}` : `${lvl} Survey Visit · ${short}`,
        type: "visit",
        start: a.site_visit_date,
        time: "8:00 AM – 5:00 PM",
        where,
        prog: short,
        part: [...team, "QAC"].join(", "),
      });
    }
    if (a.due_date) {
      out.push({
        id: `deadline:${a.id}`,
        title: `Deadline: ${short} ${lvl} documents`,
        type: "dead",
        start: a.due_date,
        time: "11:59 PM",
        where: "Upload in QAC-WARDS",
        prog: short,
        part: "Program rep",
      });
    }
  }
  return out.sort((x, y) => x.start.localeCompare(y.start));
}
