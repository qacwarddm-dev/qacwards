import { createClient } from "@/lib/supabase/server";
import { areaLabel, personName, programShort, shortDate } from "@/lib/program-names";
import { levelName } from "@/lib/qac-model";
import { SUBMISSION_STATUS, type ArchiveCycle, type ArchiveDetail, type ArchiveEntry, type ArchiveFile, type ArchiveIssue, type CycleActivity, type CycleContents, type CycleDoc, type CycleProgram } from "@/lib/archive-model";

export * from "@/lib/archive-model";

const CHUNK = 20;
const FOLDERS = { cert: "aaccup-certificate", sof: "aaccup-summary-of-findings-and-recommendation" } as const;

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Review = { decision: string; note: string | null; created_at: string; reviewer: { surname: string; given_name: string } | null };
type Doc = {
  id: string;
  submission_id: string;
  requirement_area_id: string | null;
  title: string;
  upload_note: string | null;
  version: number;
  supersedes_id: string | null;
  is_current: boolean;
  uploaded_at: string;
  requirement_areas: { name: string } | null;
  phase_documents: { name: string } | null;
  uploader: { surname: string; given_name: string } | null;
  document_reviews: Review[];
};

async function loadDocs(supabase: Supabase, submissionIds: string[]): Promise<Doc[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < submissionIds.length; i += CHUNK) chunks.push(submissionIds.slice(i, i + CHUNK));
  const pages = await Promise.all(
    chunks.map((ids) =>
      supabase
        .from("submission_documents")
        .select(
          "id, submission_id, requirement_area_id, title, upload_note, version, supersedes_id, is_current, uploaded_at, requirement_areas(name), phase_documents(name), uploader:uploaded_by(surname, given_name), document_reviews(decision, note, created_at, reviewer:reviewer_id(surname, given_name))",
        )
        .in("submission_id", ids)
        .eq("is_draft", false)
        .limit(5000),
    ),
  );
  return pages.flatMap((p) => (p.data ?? []) as unknown as Doc[]);
}

const newest = (reviews: Review[]) => [...reviews].sort((x, y) => y.created_at.localeCompare(x.created_at));

function approvedAt(reviews: Review[]): string | null {
  const last = newest(reviews)[0];
  return last?.decision === "approved" ? last.created_at : null;
}

function issuesOf(docs: Doc[]): { issues: ArchiveIssue[]; acceptedAt: string | null } {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const issues: ArchiveIssue[] = [];
  let acceptedAt: string | null = null;
  for (const d of docs) {
    if (!d.is_current) continue;
    const ok = approvedAt(d.document_reviews);
    if (ok && (!acceptedAt || ok > acceptedAt)) acceptedAt = ok;
    if (!d.supersedes_id || !d.requirement_area_id) continue;
    let returned: Review | null = null;
    let first: Doc | undefined;
    for (let cur = byId.get(d.supersedes_id); cur; cur = cur.supersedes_id ? byId.get(cur.supersedes_id) : undefined) {
      first = cur;
      returned ??= newest(cur.document_reviews).find((r) => r.decision === "returned") ?? null;
    }
    if (!returned || !first) continue;
    issues.push({
      areaId: d.requirement_area_id,
      area: areaLabel(d.requirement_areas?.name ?? "Area"),
      flag: returned.note ?? "Returned for revision",
      flaggedBy: returned.reviewer ? personName(returned.reviewer) : "—",
      change: d.upload_note?.trim() || "Replaced with a revised file",
      docs: d.title,
      version: d.version,
      resolvedAt: ok ?? d.uploaded_at,
      firstDocId: first.id,
      finalDocId: d.id,
    });
  }
  issues.sort((x, y) => x.area.localeCompare(y.area));
  return { issues, acceptedAt };
}

export async function getArchive(): Promise<ArchiveEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluations")
    .select(
      `assignment_id, outcome, compliance_status, score, evaluated_at,
       assignments!inner(id, created_at, site_visit_date, submission_id,
         assignment_accreditors(response, profiles(surname, given_name)),
         submissions!inner(id, program_id, level_id, cycle_id,
           accreditation_cycles(name),
           programs(name, campuses(name), colleges(code, name)),
           accreditation_levels(code)))`,
    )
    .not("outcome", "is", null)
    .order("evaluated_at", { ascending: false });

  const rows = (data ?? []).flatMap((e) => (e.assignments?.submissions ? [{ e, a: e.assignments, s: e.assignments.submissions }] : []));
  if (!rows.length) return [];

  const docs = await loadDocs(supabase, [...new Set(rows.map((r) => r.s.id))]);
  const docsBySub = new Map<string, Doc[]>();
  for (const d of docs) docsBySub.set(d.submission_id, [...(docsBySub.get(d.submission_id) ?? []), d]);

  const entries: ArchiveEntry[] = rows.map(({ e, a, s }) => {
    const { issues, acceptedAt } = issuesOf(docsBySub.get(s.id) ?? []);
    const code = s.accreditation_levels?.code ?? "";
    const passed = e.outcome === "passed";
    return {
      id: a.id,
      programId: s.program_id,
      program: s.programs?.name ?? "—",
      short: programShort(s.programs?.name ?? ""),
      college: s.programs?.colleges?.code ?? "NA",
      collegeName: s.programs?.colleges?.name ?? "Not Applicable (campus program)",
      campus: s.programs?.campuses?.name ?? "—",
      levelCode: code,
      level: levelName(code),
      cycle: s.accreditation_cycles?.name ?? "—",
      cycleId: s.cycle_id,
      visit: a.site_visit_date ? shortDate(a.site_visit_date) : null,
      visitDay: a.site_visit_date,
      accreditors: (a.assignment_accreditors ?? []).filter((m) => m.response === "accepted" && m.profiles).map((m) => personName(m.profiles)),
      grandMean: e.score === null ? null : Number(e.score),
      passed,
      status: passed ? (e.compliance_status ?? "Passed") : "Deferred",
      from: null,
      to: null,
      assignedAt: a.created_at,
      documentsAcceptedAt: acceptedAt,
      evaluatedAt: e.evaluated_at,
      issues,
      files: [],
    };
  });

  await attachFiles(supabase, entries, rows.map((r) => r.s.level_id));
  return entries;
}

async function attachFiles(supabase: Supabase, entries: ArchiveEntry[], levelIds: string[]) {
  const { data: folders } = await supabase.from("repository_folders").select("id, slug").in("slug", Object.values(FOLDERS));
  const kindOf = new Map((folders ?? []).map((f) => [f.id, f.slug === FOLDERS.cert ? "Certificate" : "Summary of Findings"] as const));
  if (!kindOf.size) return;
  const levelOf = new Map(entries.map((e, i) => [e.id, levelIds[i]]));
  const programIds = [...new Set(entries.map((e) => e.programId))];
  const files: { id: string; title: string; program_id: string; level_id: string | null; folder_id: string; created_at: string; valid_from: string | null; valid_until: string | null }[] = [];
  for (let i = 0; i < programIds.length; i += 100) {
    const { data } = await supabase
      .from("repository_files")
      .select("id, title, program_id, level_id, folder_id, created_at, valid_from, valid_until")
      .in("program_id", programIds.slice(i, i + 100))
      .in("folder_id", [...kindOf.keys()])
      .eq("is_archived", false)
      .limit(2000);
    files.push(...(data ?? []));
  }
  for (const f of files) {
    const mine = entries.filter((e) => e.programId === f.program_id && levelOf.get(e.id) === f.level_id).sort((a, b) => a.assignedAt.localeCompare(b.assignedAt));
    if (!mine.length) continue;
    const target = [...mine].reverse().find((e) => e.assignedAt <= f.created_at) ?? mine[0];
    const kind = kindOf.get(f.folder_id);
    if (!kind) continue;
    const file: ArchiveFile = { id: f.id, kind, title: f.title };
    target.files.push(file);
    if (kind === "Certificate" && target.passed && f.valid_until) {
      target.from = f.valid_from;
      target.to = f.valid_until;
    }
  }
  for (const e of entries) e.files.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "Certificate" ? -1 : 1));
}

export async function getArchiveCycles(entries: ArchiveEntry[]): Promise<ArchiveCycle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accreditation_cycles")
    .select("id, name, start_date, end_date, closed_at, profiles:closed_by(surname, given_name)")
    .eq("status", "closed")
    .order("end_date", { ascending: false });
  const rows = data ?? [];
  const sizes = await Promise.all(rows.map((c) => supabase.from("submissions").select("id", { count: "exact", head: true }).eq("cycle_id", c.id)));
  return rows.map((c, i) => ({
    id: c.id,
    name: c.name,
    start: c.start_date,
    end: c.end_date,
    closedAt: c.closed_at,
    closedBy: c.profiles ? personName(c.profiles) : null,
    programs: sizes[i].count ?? 0,
    archived: entries.filter((e) => e.cycleId === c.id).length,
  }));
}

export async function getArchiveDetail(assignmentId: string): Promise<ArchiveDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("archive_detail", { p_assignment: assignmentId });
  return (data as ArchiveDetail | null) ?? null;
}

const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

function docState(reviews: Review[]): { state: CycleDoc["state"]; note: string | null } {
  const last = newest(reviews)[0];
  if (last?.decision === "approved") return { state: "approved", note: null };
  if (last?.decision === "returned") return { state: "returned", note: last.note };
  return { state: "pending", note: null };
}

export async function getCycleContents(cycleId: string, entries: ArchiveEntry[]): Promise<CycleContents> {
  const supabase = await createClient();
  const [{ data: subs }, { data: events }] = await Promise.all([
    supabase
      .from("submissions")
      .select(
        `id, attempt, status, submitted_at,
         accreditation_levels(code),
         programs(name, campuses(name), colleges(code)),
         assignments(id, created_at, site_visit_date,
           assignment_accreditors(response, profiles(surname, given_name)),
           evaluations(outcome, evaluated_at))`,
      )
      .eq("cycle_id", cycleId)
      .order("created_at"),
    supabase.from("events").select("id, title, start_time").eq("cycle_id", cycleId).is("cancelled_at", null).order("start_time", { ascending: false }).limit(200),
  ]);

  const rows = subs ?? [];
  const docs = rows.length ? await loadDocs(supabase, rows.map((r) => r.id)) : [];
  const docsBySub = new Map<string, Doc[]>();
  for (const d of docs) docsBySub.set(d.submission_id, [...(docsBySub.get(d.submission_id) ?? []), d]);

  const activity: CycleActivity[] = [];
  const shortOf = new Map<string, string>();

  const programs: CycleProgram[] = rows.map((s) => {
    const short = programShort(s.programs?.name ?? "");
    shortOf.set(s.id, short);
    const asg = one(s.assignments);
    const ev = asg ? one(asg.evaluations) : null;
    const level = levelName(s.accreditation_levels?.code ?? "");
    const accreditors = (asg?.assignment_accreditors ?? []).filter((m) => m.response === "accepted" && m.profiles).map((m) => personName(m.profiles));
    const result = ev?.outcome ? (ev.outcome === "passed" ? "passed" : "deferred") : null;

    if (s.submitted_at) activity.push({ id: `s${s.id}`, at: s.submitted_at, kind: "submission", program: short, text: `Filed the ${level} submission${s.attempt > 1 ? ` (attempt ${s.attempt})` : ""}`, note: null });
    if (asg) {
      activity.push({ id: `a${asg.id}`, at: asg.created_at, kind: "assignment", program: short, text: accreditors.length ? `Accreditors assigned: ${accreditors.join(" and ")}` : "Accreditors assigned", note: null });
      if (asg.site_visit_date) activity.push({ id: `v${asg.id}`, at: `${asg.site_visit_date}T00:00:00+08:00`, kind: "visit", program: short, text: "Survey visit", note: null });
    }
    if (ev?.outcome && ev.evaluated_at) activity.push({ id: `r${s.id}`, at: ev.evaluated_at, kind: "result", program: short, text: result === "passed" ? `Passed ${level}` : `Deferred ${level} · re-survey needed`, note: null });

    const mine = docsBySub.get(s.id) ?? [];
    return {
      id: s.id,
      program: s.programs?.name ?? "—",
      short,
      college: s.programs?.colleges?.code ?? "NA",
      campus: s.programs?.campuses?.name ?? "—",
      level,
      attempt: s.attempt,
      status: SUBMISSION_STATUS[s.status] ?? s.status,
      submittedAt: s.submitted_at,
      visit: asg?.site_visit_date ?? null,
      accreditors,
      result,
      archiveId: asg && entries.some((e) => e.id === asg.id) ? asg.id : null,
      docs: mine
        .filter((d) => d.is_current)
        .map((d) => ({
          id: d.id,
          title: d.title,
          area: areaLabel(d.requirement_areas?.name ?? d.phase_documents?.name ?? "—"),
          version: d.version,
          uploadedAt: d.uploaded_at,
          by: personName(d.uploader),
          ...docState(d.document_reviews),
        }))
        .sort((a, b) => a.area.localeCompare(b.area) || a.title.localeCompare(b.title)),
    };
  });

  for (const d of docs) {
    const short = shortOf.get(d.submission_id) ?? null;
    activity.push({ id: `d${d.id}`, at: d.uploaded_at, kind: "document", program: short, text: `${personName(d.uploader)} uploaded ${d.title}${d.version > 1 ? ` (v${d.version})` : ""}`, note: d.upload_note?.trim() || null });
    for (const r of d.document_reviews) {
      if (r.decision !== "approved" && r.decision !== "returned") continue;
      activity.push({ id: `w${d.id}${r.created_at}`, at: r.created_at, kind: "review", program: short, text: `${r.reviewer ? personName(r.reviewer) : "QAC"} ${r.decision} ${d.title}`, note: r.decision === "returned" ? r.note : null });
    }
  }
  for (const e of events ?? []) activity.push({ id: `e${e.id}`, at: e.start_time, kind: "event", program: null, text: e.title, note: null });

  activity.sort((a, b) => b.at.localeCompare(a.at));
  return { programs, activity: activity.slice(0, 300), documents: programs.reduce((n, p) => n + p.docs.length, 0), events: events?.length ?? 0 };
}
