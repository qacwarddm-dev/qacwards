export type ArchiveIssue = {
  areaId: string;
  area: string;
  flag: string;
  flaggedBy: string;
  change: string;
  docs: string;
  version: number;
  resolvedAt: string;
  firstDocId: string;
  finalDocId: string;
};

export type ArchiveFile = { id: string; kind: "Certificate" | "Summary of Findings"; title: string; createdAt: string; size: number | null };

export type ArchiveEntry = {
  id: string;
  programId: string;
  program: string;
  short: string;
  college: string;
  collegeName: string;
  campus: string;
  levelCode: string;
  level: string;
  cycle: string;
  cycleId: string;
  visit: string | null;
  visitDay: string | null;
  accreditors: string[];
  grandMean: number | null;
  passed: boolean;
  status: string;
  from: string | null;
  to: string | null;
  assignedAt: string;
  documentsAcceptedAt: string | null;
  areasAccepted: number;
  areasTotal: number;
  evaluatedAt: string | null;
  issues: ArchiveIssue[];
  files: ArchiveFile[];
};

export type ArchiveDetail = {
  reports: { name: string; grandMean: number | null; findings: string | null; recommendation: string | null; reviewedAt: string | null }[];
  ratings: { areaId: string; name: string; mean: number }[];
};

export type ArchiveCycle = {
  id: string;
  name: string;
  start: string;
  end: string;
  closedAt: string | null;
  closedBy: string | null;
  programs: number;
  archived: number;
  files: number;
};

export type ArchiveData = { entries: ArchiveEntry[] };

export type CycleFileGroup = "ph" | "ar" | "ev";

export const CYCLE_GROUPS: Record<CycleFileGroup, string> = { ph: "Pre-Accreditation Phases", ar: "Accreditation Areas", ev: "Evaluation & result" };

export type CycleFileState = "accepted" | "returned" | "pending" | "acknowledged" | "recorded";

export type CycleFile = {
  id: string;
  source: "submission" | "repository" | "report";
  group: CycleFileGroup;
  sub: string;
  name: string;
  version: number;
  by: string;
  at: string;
  size: number | null;
  state: CycleFileState;
  note: string | null;
  returnedV1: { id: string; note: string } | null;
};

export type CycleProgram = {
  id: string;
  program: string;
  short: string;
  college: string;
  collegeName: string;
  campus: string;
  level: string;
  levelCode: string;
  accreditors: string[];
  result: "passed" | "deferred" | null;
  archiveId: string | null;
  movedTo: string | null;
  files: CycleFile[];
};

export type CycleContents = { programs: CycleProgram[] };

export const cycleResultTone = (p: CycleProgram): "ok" | "ret" | "miss" => (p.result === "passed" ? "ok" : p.result === "deferred" ? "ret" : "miss");

export function cycleResultLabel(p: CycleProgram): string {
  return p.result === "passed" ? "Passed" : p.result === "deferred" ? "Deferred" : "Not finished";
}

export const SUBMISSION_STATUS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  under_evaluation: "Under evaluation",
  evaluated: "Evaluated",
  returned: "Returned",
};

export function describeMean(v: number): string {
  return v >= 4.5 ? "Excellent" : v >= 3.5 ? "Very Satisfactory" : v >= 2.5 ? "Satisfactory" : v >= 1.5 ? "Fair" : "Poor";
}

export function bullets(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export type ArchiveFilters = { q: string; year: string; campus: string; level: string; result: string; area: string; cycle: string };

export const NO_FILTERS: ArchiveFilters = { q: "", year: "all", campus: "all", level: "all", result: "all", area: "all", cycle: "all" };

export function entryYear(e: ArchiveEntry): string {
  return (e.visitDay ?? e.evaluatedAt ?? e.assignedAt).slice(0, 4);
}

export function filterArchive(list: ArchiveEntry[], f: ArchiveFilters): ArchiveEntry[] {
  const q = f.q.trim().toLowerCase();
  return list.filter(
    (e) =>
      (f.cycle === "all" || e.cycleId === f.cycle) &&
      (f.year === "all" || entryYear(e) === f.year) &&
      (f.campus === "all" || e.campus === f.campus) &&
      (f.level === "all" || e.levelCode === f.level) &&
      (f.result === "all" || (f.result === "passed") === e.passed) &&
      (f.area === "all" || e.issues.some((i) => i.area === f.area)) &&
      (!q || `${e.program} ${e.short} ${e.campus} ${e.issues.map((i) => `${i.flag} ${i.change}`).join(" ")}`.toLowerCase().includes(q)),
  );
}
