import { allPhaseSlots, countSlots, includedAreas, missingChoices, type Counts, type SubmissionReview } from "@/lib/review-model";

export type RepLevel = {
  levelId: string;
  code: string;
  name: string;
  short: string;
  ordinal: number;
  submissionId: string | null;
  status: string | null;
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
  const c: Counts = levelCounts(l);
  if (!l.review || (c.pct === 0 && !c.re)) return { t: "Not started", tone: "miss", sub: `${c.req || "All"} documents to upload` };
  if (c.miss === 0 && !c.re) return { t: "Ready to submit", tone: "ok", sub: "All documents uploaded" };
  return { t: "In progress", tone: "pend", sub: `${c.miss} to upload${c.re ? ` · ${c.re} to revise` : ""}` };
}
