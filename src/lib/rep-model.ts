import { allPhaseSlots, countSlots, includedAreas, missingChoices, type Counts, type SubmissionReview } from "@/lib/review-model";
import { areaLabel } from "@/lib/program-names";
import { computeProgress, type ProgressInput } from "@/lib/progress-model";

export type RepLevel = {
  levelId: string;
  code: string;
  name: string;
  short: string;
  ordinal: number;
  submissionId: string | null;
  status: string | null;
  closed: boolean;
  accreditors: { name: string; accepted: boolean; leader: boolean }[];
  /** QAC acknowledged the Team Leader's overall report. */
  reportAcknowledged: boolean;
  /** Released visit result ("Passed" / "Deferred"); null until QAC releases it. */
  result: string | null;
  review: SubmissionReview | null;
};

export type RepProgram = {
  id: string;
  name: string;
  campus: string | null;
  college: string | null;
  levels: RepLevel[];
  psvPassed: boolean;
  awarded: string[];
};

/** The level a programme is working on now: the highest level it has a submission for. */
export function currentLevel(p: RepProgram): RepLevel {
  const withSub = p.levels.filter((l) => l.submissionId);
  return withSub.at(-1) ?? p.levels[0];
}

export function levelCounts(l: RepLevel, stage?: "pre" | "req") {
  const r = l.review;
  if (!r) return countSlots([], 0);
  if (stage === "pre") return countSlots(allPhaseSlots(r));
  if (stage === "req") return countSlots(includedAreas(r), missingChoices(r));
  return countSlots([...allPhaseSlots(r), ...includedAreas(r)], missingChoices(r));
}


export type LevelStatus = { t: string; tone: "ok" | "pend" | "ret" | "miss" | "blue"; sub: string };

export function isLocked(p: RepProgram, l: RepLevel) {
  if (l.submissionId) return false;
  const i = p.levels.findIndex((x) => x.levelId === l.levelId);
  if (i <= 0) return false;
  return !p.awarded.includes(p.levels[i - 1].code);
}

export function levelStatus(p: RepProgram, l: RepLevel, visit?: string | null): LevelStatus {
  const i = p.levels.findIndex((x) => x.levelId === l.levelId);
  if (isLocked(p, l)) return { t: "Locked", tone: "miss", sub: `Unlocks after ${p.levels[i - 1]?.name ?? "the previous level"}` };
  if (p.awarded.includes(l.code)) return { t: "Visit completed", tone: "ok", sub: visit ?? "Passed" };
  if (l.status === "submitted" || l.status === "under_evaluation" || l.status === "evaluated")
    return { t: "Submitted · For evaluation", tone: "blue", sub: "Accreditors are evaluating" };
  if (l.closed) return { t: "Cycle ended", tone: "ret", sub: "Submissions are closed" };
  const c: Counts = levelCounts(l);
  if (!l.review || (c.up === 0 && !c.re)) return { t: "Not started", tone: "miss", sub: `${c.req || "All"} documents to upload` };
  if (c.miss === 0 && !c.re) return { t: "Ready to submit", tone: "ok", sub: "All documents uploaded" };
  return { t: "In progress", tone: "pend", sub: `${c.miss} to upload${c.re ? ` · ${c.re} to revise` : ""}` };
}

/** What the accreditation progress tracker counts for a level: accreditor acceptance, accepted areas,
 *  the acknowledged report and the released result — the same four stages QAC sees. */
export function repProgressInput(program: RepProgram, level: RepLevel): ProgressInput {
  const r = level.review;
  const areas = (r ? includedAreas(r) : []).map((a) => ({ name: areaLabel(a.name), state: a.state, remark: a.returnNote ?? undefined }));
  for (let i = 0; i < (r ? missingChoices(r) : 0); i++) areas.push({ name: "Chosen area (not picked yet)", state: "missing" as const, remark: undefined });
  const done = program.awarded.includes(level.code);
  return {
    accreditors: level.accreditors.map((a) => ({ name: a.name, accepted: a.accepted, report: a.leader && level.reportAcknowledged ? ("ack" as const) : ("none" as const), leader: a.leader })),
    areas,
    completed: done,
    result: done ? "Passed" : level.result,
  };
}

/** The one percentage shown for a program level, matching what QAC sees for it. */
export const levelPercent = (program: RepProgram, level: RepLevel) => computeProgress(repProgressInput(program, level)).percent;
