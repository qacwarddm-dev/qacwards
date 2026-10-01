export type DocState = "approved" | "pending" | "returned" | "missing" | "draft";

export type HistItem = { who: string; byId: string | null; date: string; at: string; msg: string; tone: "rev" | "me" | "ok" };

export type Slot = {
  key: string;
  kind: "phase" | "area";
  refId: string;
  name: string;
  ordinal: number;
  optional: boolean;
  state: DocState;
  docId: string | null;
  file: string | null;
  size: string | null;
  date: string | null;
  uploadedAt: string | null;
  version: number;
  by: string | null;
  returnNote: string | null;
  returnedBy: string | null;
  returnedById: string | null;
  reviewedBy: string | null;
  reviewedById: string | null;
  draftId: string | null;
  draftFile: string | null;
  history: HistItem[];
};

export type PhaseGroup = { id: string; ordinal: number; name: string; docs: Slot[] };

export type ProgramInfo = {
  id: string;
  name: string;
  mid: string;
  short: string;
  campus: string;
  college: string;
  collegeName: string;
};

export type SubmissionReview = {
  submissionId: string;
  status: string;
  levelId: string;
  levelCode: string;
  levelName: string;
  levelShort: string;
  requiredChoices: number | null;
  program: ProgramInfo;
  phases: PhaseGroup[];
  areas: Slot[];
  chosen: string[];
};

export type Counts = { req: number; ap: number; pe: number; re: number; miss: number; dr: number; up: number; pct: number };

export function countSlots(slots: Slot[], extraRequired = 0): Counts {
  const c: Counts = { req: slots.length + extraRequired, ap: 0, pe: 0, re: 0, miss: extraRequired, dr: 0, up: 0, pct: 0 };
  for (const s of slots) {
    if (s.state === "approved") c.ap++;
    else if (s.state === "pending") c.pe++;
    else if (s.state === "returned") c.re++;
    else if (s.state === "draft") {
      c.dr++;
      c.miss++;
    } else c.miss++;
  }
  c.up = c.ap + c.pe;
  c.pct = c.req ? Math.round((c.up / c.req) * 100) : 0;
  return c;
}

/** Share approved only — what QAC and accreditors call "done". */
export function approvedPct(c: Counts) {
  return c.req ? Math.round((c.ap / c.req) * 100) : 0;
}

export const allPhaseSlots = (r: SubmissionReview) => r.phases.flatMap((p) => p.docs);

/** Areas that count toward the level: every mandatory area plus the chosen optional ones. */
export function includedAreas(r: SubmissionReview) {
  return r.areas.filter((a) => !a.optional || r.chosen.includes(a.refId));
}

export function missingChoices(r: SubmissionReview) {
  if (!r.requiredChoices) return 0;
  const picked = r.areas.filter((a) => a.optional && r.chosen.includes(a.refId)).length;
  return Math.max(0, r.requiredChoices - picked);
}


export type IndicatorRating = { rating: number | null; remark: string };
export type AreaRatings = Record<string, Record<number, IndicatorRating>>;

export const INDICATORS = [
  "Documents are complete and up to date",
  "Evidence matches the stated criteria",
  "Implementation is shown (photos, reports, minutes)",
];

export function ratedCount(r: Record<number, IndicatorRating> | undefined) {
  if (!r) return 0;
  return [1, 2, 3].filter((i) => r[i]?.rating).length;
}

export function areaMean(r: Record<number, IndicatorRating> | undefined) {
  const v = [1, 2, 3].map((i) => r?.[i]?.rating).filter((x): x is number => Boolean(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

export const describeMean = (v: number) =>
  v >= 4.5 ? "Excellent" : v >= 3.5 ? "Very Satisfactory" : v >= 2.5 ? "Satisfactory" : v >= 1.5 ? "Fair" : "Poor";
