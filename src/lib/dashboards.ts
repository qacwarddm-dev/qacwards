import { createClient } from "@/lib/supabase/server";
import { getMyPrograms } from "@/lib/submissions";
import { getMonthEvents } from "@/lib/events";
import type { DocStatus, MeetingKind, Stat, StatusBar, Upload } from "@/components/portal/kit";

/**
 * Reads behind the three role dashboards (B9). Scoped by RLS throughout, same
 * convention as `submissions.ts` / `assignments.ts` — nothing here filters by
 * the caller's own id beyond what a policy already enforces, except where a
 * screen needs to know *which* row among several visible ones is "mine" (the
 * accreditor's own response inside a shared assignment team, same shape as
 * `getAssignments`'s `myResponse`).
 */

const MANILA = "Asia/Manila";

/** Every dashboard tile's note. There is no historical snapshot to diff
 *  against, so the "1.10% since last month" trend arrows in the old fake data
 *  are dropped rather than invented — this is the honest replacement. */
export function asOfNow(): string {
  return `As of ${new Date().toLocaleDateString("en-US", { timeZone: MANILA, month: "long", year: "numeric" })}`;
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}, ${remMins} min${remMins === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

type LevelAwardCounts = Record<"I" | "II" | "III" | "IV", number>;

/**
 * Programmes' current standing, bucketed by level. The QAC KPI tiles, the
 * COPC chart and the rep dashboard's department tiles all read the same
 * `current_program_level` view — see the comment on that view in
 * `20260818000600_assignments_evaluations.sql`. Readable by every
 * authenticated user (awards are public standing inside the portal), so no
 * role branch is needed here.
 */
async function programLevelCounts(programIds?: string[]): Promise<LevelAwardCounts> {
  const supabase = await createClient();
  let query = supabase.from("current_program_level").select("level_code, program_id");
  if (programIds) query = query.in("program_id", programIds);
  const { data } = await query;

  const counts: LevelAwardCounts = { I: 0, II: 0, III: 0, IV: 0 };
  for (const row of data ?? []) {
    if (row.level_code && row.level_code in counts) {
      counts[row.level_code as keyof LevelAwardCounts]++;
    }
  }
  return counts;
}

/* --------------------------------------------------------------------------
 * QAC Personnel / QAC Admin
 * ---------------------------------------------------------------------- */

export async function getQacDashboard(): Promise<{ stats: Stat[]; copcSeries: number[] }> {
  const counts = await programLevelCounts();
  const overall = counts.I + counts.II + counts.III + counts.IV;
  const note = asOfNow();

  return {
    stats: [
      { label: "LEVEL I", value: String(counts.I), note },
      { label: "LEVEL II", value: String(counts.II), note },
      { label: "LEVEL III", value: String(counts.III), note },
      { label: "LEVEL IV", value: String(counts.IV), note },
      { label: "OVERALL", value: String(overall), note },
    ],
    copcSeries: [counts.I, counts.II, counts.III, counts.IV],
  };
}

/**
 * `/portal/reports`' five KPI tiles — decision 18: "derived from the KPI
 * tiles for now; final [report] list decided later" (O-7). This function is
 * that whole decision; there is no `reports` table and no generator behind
 * the screen's "New" button, deliberately not invented here.
 *
 * "NOT ACCREDITABLE" has no backing column — OtherContext.txt never defines
 * which programmes are ineligible for accreditation as a category, distinct
 * from *not yet* accredited. Read here as "programmes with award standing at zero
 * levels", the same `current_program_level` view the QAC dashboard already
 * uses — flagged as O-22 rather than asserted as authoritative.
 */
export async function getReportsStats(): Promise<Stat[]> {
  const supabase = await createClient();
  const note = asOfNow();

  const [{ count: total }, { count: mainCampus }, counts] = await Promise.all([
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase
      .from("programs")
      .select("id", { count: "exact", head: true })
      .not("college_id", "is", null),
    programLevelCounts(),
  ]);

  const offered = total ?? 0;
  const main = mainCampus ?? 0;
  const withCopc = counts.I + counts.II + counts.III + counts.IV;

  return [
    { label: "ACADEMIC OFFERED", value: String(offered), note },
    { label: "MAIN CAMPUS", value: String(main), note },
    { label: "CAMPUSES", value: String(offered - main), note },
    { label: "WITH COPC", value: String(withCopc), note },
    { label: "NOT ACCREDITABLE", value: String(offered - withCopc), note },
  ];
}

/* --------------------------------------------------------------------------
 * Program Representative
 * ---------------------------------------------------------------------- */

export type RepDashboard = {
  stats: Stat[];
  docStatus: StatusBar[];
  docStatusMax: number;
  recentUploads: Upload[];
  ongoing: { id: string; program: string; level: string; accreditor: string }[];
};

const EMPTY_REP_DASHBOARD: RepDashboard = {
  stats: [
    { label: "COMPLETION RATE", value: "0%", note: asOfNow() },
    { label: "LEVEL II", value: "0", note: asOfNow() },
    { label: "LEVEL III", value: "0", note: asOfNow() },
    { label: "LEVEL IV", value: "0", note: asOfNow() },
    { label: "DEPARTMENT PROGRAMS", value: "0", note: asOfNow() },
  ],
  docStatus: [
    { status: "approved", value: 0 },
    { status: "pending", value: 0 },
    { status: "disapproved", value: 0 },
  ],
  docStatusMax: 1,
  recentUploads: [],
  ongoing: [],
};

/**
 * A representative may hold more than one programme (decision 6); this reads
 * off the first one, same known limitation already flagged on the repository
 * tab in B6 — a programme picker is future work, not invented here.
 */
export async function getRepDashboard(): Promise<RepDashboard> {
  const supabase = await createClient();
  const note = asOfNow();

  const programs = await getMyPrograms();
  const programId = programs[0]?.id;
  if (!programId) return EMPTY_REP_DASHBOARD;

  const { data: program } = await supabase
    .from("programs")
    .select("id, college_id, campus_id")
    .eq("id", programId)
    .maybeSingle();

  // "Department" = same college on the main campus, or same campus where the
  // campus has no colleges of its own — satellite programmes carry a null
  // college_id (O-1 / decision 6).
  let siblingIds = [programId];
  if (program) {
    const { data: siblings } = program.college_id
      ? await supabase.from("programs").select("id").eq("college_id", program.college_id)
      : await supabase.from("programs").select("id").eq("campus_id", program.campus_id);
    if (siblings && siblings.length > 0) siblingIds = siblings.map((s) => s.id);
  }

  const [levelCounts, { data: submissions }] = await Promise.all([
    programLevelCounts(siblingIds),
    supabase.from("submissions").select("id").eq("program_id", programId),
  ]);

  const submissionIds = (submissions ?? []).map((s) => s.id);

  const { data: readinessRows } = submissionIds.length
    ? await supabase
        .from("submission_readiness")
        .select("readiness_percent")
        .in("submission_id", submissionIds)
    : { data: [] as { readiness_percent: number | null }[] };

  const pcts = (readinessRows ?? []).map((r) => r.readiness_percent ?? 0);
  const completionRate = pcts.length
    ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
    : 0;

  const { data: docs } = submissionIds.length
    ? await supabase
        .from("submission_documents")
        .select("id, title, uploaded_at, uploaded_by(surname, given_name)")
        .in("submission_id", submissionIds)
        .eq("is_current", true)
        .order("uploaded_at", { ascending: false })
    : {
        data: [] as {
          id: string;
          title: string;
          uploaded_at: string;
          uploaded_by: { surname: string; given_name: string } | null;
        }[],
      };

  const docIds = (docs ?? []).map((d) => d.id);

  const { data: statuses } = docIds.length
    ? await supabase
        .from("submission_document_status")
        .select("submission_document_id, decision")
        .in("submission_document_id", docIds)
    : { data: [] as { submission_document_id: string | null; decision: DocStatus | null }[] };

  const decisionById = new Map(
    (statuses ?? []).map((s) => [s.submission_document_id, s.decision ?? "pending"]),
  );

  let approved = 0;
  let pending = 0;
  let disapproved = 0;
  for (const id of docIds) {
    const d = decisionById.get(id) ?? "pending";
    if (d === "approved") approved++;
    else if (d === "disapproved") disapproved++;
    else pending++;
  }

  const recentUploads: Upload[] = (docs ?? []).slice(0, 4).map((d) => ({
    id: d.id,
    title: d.title,
    uploadedBy: d.uploaded_by ? `${d.uploaded_by.given_name} ${d.uploaded_by.surname}` : "—",
    when: relativeTime(d.uploaded_at),
    status: (decisionById.get(d.id) ?? "pending") as DocStatus,
    kind: "file",
  }));

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, status,
       submissions(program_id, programs(name), accreditation_levels(name)),
       assignment_accreditors(response, profiles(surname, given_name))`,
    )
    .neq("status", "score_returned")
    .order("created_at", { ascending: false });

  const ongoing = (assignments ?? [])
    .filter((a) => a.submissions?.program_id === programId)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      program: a.submissions?.programs?.name ?? "—",
      level: a.submissions?.accreditation_levels?.name ?? "—",
      accreditor:
        (a.assignment_accreditors ?? [])
          .map((m) => (m.profiles ? `${m.profiles.surname}, ${m.profiles.given_name}` : null))
          .filter((n): n is string => Boolean(n))
          .join("; ") || "—",
    }));

  return {
    stats: [
      { label: "COMPLETION RATE", value: `${completionRate}%`, note },
      { label: "LEVEL II", value: String(levelCounts.II), note },
      { label: "LEVEL III", value: String(levelCounts.III), note },
      { label: "LEVEL IV", value: String(levelCounts.IV), note },
      { label: "DEPARTMENT PROGRAMS", value: String(siblingIds.length), note },
    ],
    docStatus: [
      { status: "approved", value: approved },
      { status: "pending", value: pending },
      { status: "disapproved", value: disapproved },
    ],
    docStatusMax: Math.max(approved, pending, disapproved, 1),
    recentUploads,
    ongoing,
  };
}

/* --------------------------------------------------------------------------
 * Internal Accreditor
 * ---------------------------------------------------------------------- */

const PHASE_LABEL: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  for_psv: "For Preliminary Survey Visit",
  evaluated: "Evaluated",
  score_returned: "Score Returned",
};

const RESPONSE_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

export type IaDashboard = {
  stats: Stat[];
  assignedEvaluations: {
    id: string;
    campus: string;
    program: string;
    level: string;
    phase: string;
    status: string;
  }[];
  evaluationProgress: {
    id: string;
    campus: string;
    program: string;
    level: string;
    readiness: number;
  }[];
};

export async function getIaDashboard(viewerId: string): Promise<IaDashboard> {
  const supabase = await createClient();
  const note = asOfNow();

  const { data: assignments } = await supabase
    .from("assignments")
    .select(
      `id, status, due_date, submission_id,
       submissions(programs(name, campuses(name)), accreditation_levels(name)),
       assignment_accreditors(profile_id, response)`,
    )
    .order("due_date", { ascending: true });

  const submissionIds = (assignments ?? [])
    .map((a) => a.submission_id)
    .filter((id): id is string => Boolean(id));

  const { data: readinessRows } = submissionIds.length
    ? await supabase
        .from("submission_readiness")
        .select("submission_id, readiness_percent")
        .in("submission_id", submissionIds)
    : { data: [] as { submission_id: string | null; readiness_percent: number | null }[] };

  const readinessBySubmission = new Map(
    (readinessRows ?? []).map((r) => [r.submission_id, r.readiness_percent ?? 0]),
  );

  const now = new Date();
  let assignedCount = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let dueThisMonthCount = 0;

  const assignedEvaluations: IaDashboard["assignedEvaluations"] = [];
  const evaluationProgress: IaDashboard["evaluationProgress"] = [];

  for (const a of assignments ?? []) {
    const mine = (a.assignment_accreditors ?? []).find((m) => m.profile_id === viewerId);
    if (!mine) continue; // not on this assignment's team

    assignedCount++;
    if (mine.response === "pending") pendingCount++;
    if (a.status === "score_returned") completedCount++;
    if (
      a.due_date &&
      a.status !== "score_returned" &&
      new Date(a.due_date).getFullYear() === now.getFullYear() &&
      new Date(a.due_date).getMonth() === now.getMonth()
    ) {
      dueThisMonthCount++;
    }

    const campus = a.submissions?.programs?.campuses?.name ?? "—";
    const program = a.submissions?.programs?.name ?? "—";
    const level = a.submissions?.accreditation_levels?.name ?? "—";

    assignedEvaluations.push({
      id: a.id,
      campus,
      program,
      level,
      phase: PHASE_LABEL[a.status] ?? a.status,
      status: RESPONSE_LABEL[mine.response] ?? mine.response,
    });

    evaluationProgress.push({
      id: a.id,
      campus,
      program,
      level,
      readiness: a.submission_id ? (readinessBySubmission.get(a.submission_id) ?? 0) : 0,
    });
  }

  return {
    stats: [
      { label: "ASSIGNED", value: String(assignedCount), note },
      { label: "PENDING", value: String(pendingCount), note },
      { label: "COMPLETED", value: String(completedCount), note },
      { label: "DUE THIS MONTH", value: String(dueThisMonthCount), note },
    ],
    assignedEvaluations,
    evaluationProgress,
  };
}

export async function getUpcomingSchedule(
  limit = 5,
): Promise<{ id: string; date: string; title: string; program: string; collegeCampus: string }[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(
      "id, title, start_time, cancelled_at, event_programs(programs(name, campuses(name), colleges(code)))",
    )
    .gte("start_time", new Date().toISOString())
    .is("cancelled_at", null)
    .order("start_time")
    .limit(limit);

  return (data ?? []).map((e) => {
    const first = e.event_programs?.[0]?.programs ?? null;
    return {
      id: e.id,
      date: new Date(e.start_time).toLocaleDateString("en-US", {
        timeZone: MANILA,
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      title: e.title,
      program: first?.name ?? "University-wide",
      collegeCampus: first ? `${first.colleges?.code ?? "—"} - ${first.campuses?.name ?? "—"}` : "—",
    };
  });
}

/* --------------------------------------------------------------------------
 * Shared — both dashboard MiniCalendars
 * ---------------------------------------------------------------------- */

/**
 * `event_kind` has no literal "copc" value — the legend's two dots are a
 * simplification of five real kinds. `survey_visit` reads as PSV directly;
 * `meeting` is read as the COPC dot, since a plain "meeting" is what a COPC
 * evaluation sit-down would be logged as. `deadline` / `holiday` / `other`
 * are left unmarked on this compact calendar rather than guessed onto one of
 * the two dots — the full `MonthCalendar` on `/portal/events` is where every
 * kind gets its own treatment.
 */
export async function getMiniCalendarData(): Promise<{
  month: Date;
  today: number;
  marks: Record<number, MeetingKind>;
}> {
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: MANILA }));
  const year = nowManila.getFullYear();
  const month = nowManila.getMonth() + 1; // 1-based, matches getMonthEvents
  const events = await getMonthEvents(year, month);

  const marks: Record<number, MeetingKind> = {};
  for (const e of events) {
    if (e.cancelled) continue;
    const day = Number(e.date.slice(-2));
    if (e.kind === "survey_visit") marks[day] = "psv";
    else if (e.kind === "meeting") marks[day] = "copc";
  }

  return { month: new Date(year, month - 1, 1), today: nowManila.getDate(), marks };
}
