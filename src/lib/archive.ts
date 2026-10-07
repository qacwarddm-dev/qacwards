import { createClient } from "@/lib/supabase/server";
import { areaLabel, personName, phaseLabel, programShort, shortDate } from "@/lib/program-names";
import { levelName } from "@/lib/qac-model";
import { type ArchiveCycle, type ArchiveDetail, type ArchiveEntry, type ArchiveFile, type ArchiveIssue, type CycleContents, type CycleFile, type CycleFileState, type CycleProgram } from "@/lib/archive-model";

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
  file_size: number;
  requirement_areas: { name: string; ordinal: number } | null;
  phase_documents: { name: string; ordinal: number; phases: { name: string; ordinal: number } | null } | null;
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
          "id, submission_id, requirement_area_id, title, upload_note, version, supersedes_id, is_current, uploaded_at, file_size, requirement_areas(name, ordinal), phase_documents(name, ordinal, phases(name, ordinal)), uploader:uploaded_by(surname, given_name), document_reviews(decision, note, created_at, reviewer:reviewer_id(surname, given_name))",
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

function issuesOf(docs: Doc[]): { issues: ArchiveIssue[]; acceptedAt: string | null; acceptedAreas: Set<string> } {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const issues: ArchiveIssue[] = [];
  const acceptedAreas = new Set<string>();
  let acceptedAt: string | null = null;
  for (const d of docs) {
    if (!d.is_current) continue;
    const ok = approvedAt(d.document_reviews);
    if (ok && (!acceptedAt || ok > acceptedAt)) acceptedAt = ok;
    if (ok && d.requirement_area_id) acceptedAreas.add(d.requirement_area_id);
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
  return { issues, acceptedAt, acceptedAreas };
}

export async function getArchive(only?: string): Promise<ArchiveEntry[]> {
  const supabase = await createClient();
  const query = supabase
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
  const { data } = await (only ? query.eq("assignments.submission_id", only) : query);

  const rows = (data ?? []).flatMap((e) => (e.assignments?.submissions ? [{ e, a: e.assignments, s: e.assignments.submissions }] : []));
  if (!rows.length) return [];

  const docs = await loadDocs(supabase, [...new Set(rows.map((r) => r.s.id))]);
  const docsBySub = new Map<string, Doc[]>();
  for (const d of docs) docsBySub.set(d.submission_id, [...(docsBySub.get(d.submission_id) ?? []), d]);

  const { data: areaRows } = await supabase.from("requirement_areas").select("id, level_id, is_optional");
  const areasByLevel = new Map<string, { id: string; optional: boolean }[]>();
  for (const a of areaRows ?? []) areasByLevel.set(a.level_id, [...(areasByLevel.get(a.level_id) ?? []), { id: a.id, optional: a.is_optional }]);

  const entries: ArchiveEntry[] = rows.map(({ e, a, s }) => {
    const { issues, acceptedAt, acceptedAreas } = issuesOf(docsBySub.get(s.id) ?? []);
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
      areasAccepted: acceptedAreas.size,
      areasTotal: (areasByLevel.get(s.level_id) ?? []).filter((x) => !x.optional || acceptedAreas.has(x.id)).length,
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
  const files: { id: string; title: string; program_id: string; level_id: string | null; folder_id: string; created_at: string; file_size: number | null; valid_from: string | null; valid_until: string | null }[] = [];
  for (let i = 0; i < programIds.length; i += 100) {
    const { data } = await supabase
      .from("repository_files")
      .select("id, title, program_id, level_id, folder_id, created_at, file_size, valid_from, valid_until")
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
    const file: ArchiveFile = { id: f.id, kind, title: f.title, createdAt: f.created_at, size: f.file_size };
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
  const sizes = await Promise.all(
    rows.map(async (c) => {
      const mine = entries.filter((e) => e.cycleId === c.id);
      const [members, docs, reports] = await Promise.all([
        supabase.from("cycle_members").select("submission_id", { count: "exact", head: true }).eq("cycle_id", c.id),
        supabase.from("cycle_documents").select("document_id", { count: "exact", head: true }).eq("cycle_id", c.id),
        mine.length ? supabase.from("accreditor_reports").select("assignment_id", { count: "exact", head: true }).eq("status", "acknowledged").in("assignment_id", mine.map((e) => e.id)) : null,
      ]);
      return { programs: members.count ?? 0, files: (docs.count ?? 0) + (reports?.count ?? 0) + mine.reduce((n, e) => n + e.files.length, 0) };
    }),
  );
  return rows.map((c, i) => ({
    id: c.id,
    name: c.name,
    start: c.start_date,
    end: c.end_date,
    closedAt: c.closed_at,
    closedBy: c.profiles ? personName(c.profiles) : null,
    programs: sizes[i].programs,
    archived: entries.filter((e) => e.cycleId === c.id).length,
    files: sizes[i].files,
  }));
}

export async function getArchiveDetail(assignmentId: string): Promise<ArchiveDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("archive_detail", { p_assignment: assignmentId });
  return (data as ArchiveDetail | null) ?? null;
}

const one = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

const PAGE_ROWS = 1000;

async function cycleDocumentIds(supabase: Supabase, cycleId: string, only?: string): Promise<Set<string>> {
  const ids = new Set<string>();
  for (let from = 0; ; from += PAGE_ROWS) {
    const base = supabase.from("cycle_documents").select("document_id").eq("cycle_id", cycleId).order("document_id").range(from, from + PAGE_ROWS - 1);
    const { data } = await (only ? base.eq("submission_id", only) : base);
    for (const r of data ?? []) if (r.document_id) ids.add(r.document_id);
    if ((data?.length ?? 0) < PAGE_ROWS) return ids;
  }
}

function fileState(reviews: Review[]): { state: CycleFileState; note: string | null } {
  const last = newest(reviews)[0];
  if (last?.decision === "approved") return { state: "accepted", note: null };
  if (last?.decision === "returned") return { state: "returned", note: last.note };
  return { state: "pending", note: null };
}

export async function getCycleContents(cycle: { id: string; closedAt: string | null }, entries: ArchiveEntry[], only?: string): Promise<CycleContents> {
  const supabase = await createClient();
  const closed = cycle.closedAt;
  const membersQuery = supabase.from("cycle_members").select("submission_id, moved_to").eq("cycle_id", cycle.id).limit(PAGE_ROWS);
  const { data: members } = await (only ? membersQuery.eq("submission_id", only) : membersQuery);
  const movedTo = new Map((members ?? []).flatMap((m) => (m.submission_id ? [[m.submission_id, m.moved_to] as const] : [])));
  const ids = [...movedTo.keys()];
  if (!ids.length) return { programs: [] };

  const subChunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 100) subChunks.push(ids.slice(i, i + 100));
  const [subPages, docIds, docs, names] = await Promise.all([
    Promise.all(
      subChunks.map((chunk) =>
        supabase
          .from("submissions")
          .select("id, accreditation_levels(code), programs(name, campuses(name), colleges(code, name)), assignments(id, assignment_accreditors(response, profiles(surname, given_name)))")
          .in("id", chunk),
      ),
    ),
    cycleDocumentIds(supabase, cycle.id, only),
    loadDocs(supabase, ids),
    supabase.from("accreditation_cycles").select("id, name").in("id", [...new Set([...movedTo.values()].filter((v): v is string => Boolean(v)))]),
  ]);
  const cycleName = new Map((names.data ?? []).map((c) => [c.id, c.name]));
  const subs = subPages.flatMap((p) => p.data ?? []);

  const docsBySub = new Map<string, Doc[]>();
  for (const d of docs) docsBySub.set(d.submission_id, [...(docsBySub.get(d.submission_id) ?? []), d]);

  const archived = new Map(entries.filter((e) => e.cycleId === cycle.id).map((e) => [e.id, e]));
  const archivedAsg = [...archived.keys()];
  const { data: reports } = archivedAsg.length
    ? await supabase.from("accreditor_reports").select("assignment_id, accreditor_id, reviewed_at, signed_at, profiles:accreditor_id(surname, given_name)").eq("status", "acknowledged").in("assignment_id", archivedAsg)
    : { data: [] };

  const programs: CycleProgram[] = subs.map((s) => {
    const asg = one(s.assignments);
    const entry = asg ? (archived.get(asg.id) ?? null) : null;
    const mine = docsBySub.get(s.id) ?? [];
    const byId = new Map(mine.map((d) => [d.id, d]));
    const inCycle = mine.filter((d) => docIds.has(d.id));

    const sorted = inCycle
      .map((d) => {
        const reviews = closed ? d.document_reviews.filter((r) => r.created_at <= closed) : d.document_reviews;
        let returned: { id: string; note: string } | null = null;
        let first: Doc = d;
        for (let cur = d.supersedes_id ? byId.get(d.supersedes_id) : undefined; cur; cur = cur.supersedes_id ? byId.get(cur.supersedes_id) : undefined) {
          first = cur;
          const hit = newest(cur.document_reviews).find((r) => r.decision === "returned");
          if (hit && !returned) returned = { id: "", note: hit.note ?? "Returned for revision" };
        }
        if (returned) returned.id = first.id;
        const area = d.requirement_areas;
        const phase = d.phase_documents;
        const group = d.requirement_area_id ? ("ar" as const) : ("ph" as const);
        const sub = area ? areaLabel(area.name) : phase?.phases ? phaseLabel(phase.phases.ordinal, phase.phases.name) : "Other documents";
        const order = area ? area.ordinal : (phase?.phases?.ordinal ?? 99) * 1000 + (phase?.ordinal ?? 0);
        const file: CycleFile = {
          id: d.id,
          source: "submission",
          group,
          sub,
          name: d.title,
          version: d.version,
          by: personName(d.uploader),
          at: d.uploaded_at,
          size: d.file_size,
          ...fileState(reviews),
          returnedV1: returned,
        };
        return { file, order };
      })
      .sort((x, y) => (x.file.group === y.file.group ? 0 : x.file.group === "ph" ? -1 : 1) || x.order - y.order || x.file.name.localeCompare(y.file.name))
      .map((x) => x.file);

    const results: CycleFile[] = [
      ...(reports ?? [])
        .filter((r) => r.assignment_id === asg?.id)
        .map<CycleFile>((r) => ({
          id: `${r.assignment_id}:${r.accreditor_id}`,
          source: "report",
          group: "ev",
          sub: "Evaluation & result",
          name: `Evaluation Report – ${r.profiles?.surname ?? "Accreditor"}`,
          version: 1,
          by: `${personName(r.profiles)} (Internal Accreditor)`,
          at: r.reviewed_at ?? r.signed_at ?? entry?.evaluatedAt ?? "",
          size: null,
          state: "acknowledged",
          note: null,
          returnedV1: null,
        }))
        .sort((x, y) => x.name.localeCompare(y.name)),
      ...(entry?.files ?? []).map<CycleFile>((f) => ({
        id: f.id,
        source: "repository",
        group: "ev",
        sub: "Evaluation & result",
        name: f.title,
        version: 1,
        by: "QAC Personnel",
        at: f.createdAt,
        size: f.size,
        state: "recorded",
        note: null,
        returnedV1: null,
      })),
    ];

    const code = s.accreditation_levels?.code ?? "";
    return {
      id: s.id,
      program: s.programs?.name ?? "—",
      short: programShort(s.programs?.name ?? ""),
      college: s.programs?.colleges?.code ?? "NA",
      collegeName: s.programs?.colleges?.name ?? "Not Applicable (campus program)",
      campus: s.programs?.campuses?.name ?? "—",
      level: levelName(code),
      levelCode: code,
      accreditors: (asg?.assignment_accreditors ?? []).filter((m) => m.response === "accepted" && m.profiles).map((m) => personName(m.profiles)),
      result: entry ? (entry.passed ? "passed" : "deferred") : null,
      archiveId: entry ? entry.id : null,
      movedTo: cycleName.get(movedTo.get(s.id) ?? "") ?? null,
      files: [...sorted, ...results],
    };
  });

  programs.sort((a, b) => Number(Boolean(b.archiveId)) - Number(Boolean(a.archiveId)) || a.program.localeCompare(b.program));
  return { programs };
}
