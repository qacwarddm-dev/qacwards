import {
  allPhaseSlots,
  areaMean,
  countSlots,
  includedAreas,
  ratedCount,
  type AreaRatings,
  type SubmissionReview,
} from "@/lib/review-model";

export type ReportState = {
  status: "draft" | "submitted" | "acknowledged" | "returned";
  findings: string;
  recommendation: string;
  signedAt: string | null;
  code: string | null;
  grandMean: number | null;
  qacNote: string | null;
};

export type TeamMember = { id: string; name: string; initials: string; response: string; me: boolean; report: ReportState | null };

export type IaAssignment = {
  id: string;
  status: string;
  submissionId: string;
  programId: string;
  program: string;
  mid: string;
  short: string;
  campus: string;
  college: string;
  collegeName: string;
  levelId: string;
  levelCode: string;
  levelName: string;
  visit: string | null;
  visitLabel: string;
  due: string | null;
  myResponse: string;
  team: TeamMember[];
  review: SubmissionReview | null;
  ratings: AreaRatings;
  report: ReportState | null;
  awardedCodes: string[];
};

export const MIN_DOCS_PCT = 10;

export function iaStats(a: IaAssignment) {
  const r = a.review;
  if (!r) return { docsPct: 0, evalN: 0, evalPct: 0, pending: 0, returned: 0, ready: false, areaTotal: 0, phaseCounts: countSlots([]), areaCounts: countSlots([]), started: false };
  const phases = allPhaseSlots(r);
  const areas = includedAreas(r);
  const all = countSlots([...phases, ...areas]);
  const evalN = areas.filter((s) => s.state === "approved" && ratedCount(a.ratings[s.refId]) === 3).length;
  const phaseAp = phases.filter((s) => s.state === "approved").length;
  const total = phases.length + areas.length;
  const started = Object.keys(a.ratings).length > 0 || [...phases, ...areas].some((s) => s.state === "approved" || s.state === "returned");
  return {
    docsPct: all.pct,
    evalN,
    evalPct: total ? Math.round(((phaseAp + evalN) / total) * 100) : 0,
    pending: all.pe,
    returned: all.re,
    ready: phases.every((s) => s.state === "approved") && areas.every((s) => s.state === "approved" && ratedCount(a.ratings[s.refId]) === 3),
    areaTotal: areas.length,
    phaseCounts: countSlots(phases),
    areaCounts: countSlots(areas),
    started,
  };
}

export function grandMean(a: IaAssignment) {
  const areas = a.review ? includedAreas(a.review) : [];
  if (!areas.length) return 0;
  return areas.reduce((s, x) => s + areaMean(a.ratings[x.refId]), 0) / areas.length;
}

export function statusLabel(a: IaAssignment): { t: string; tone: "pend" | "ok" | "blue" | "miss" } {
  if (a.myResponse === "pending") return { t: "New", tone: "blue" };
  if (a.myResponse === "rejected") return { t: "Declined", tone: "miss" };
  if (a.report && a.report.status !== "draft" && a.report.status !== "returned") return { t: "Submitted", tone: "ok" };
  return { t: `For ${a.levelCode === "PSV" ? "PSV" : a.levelName}`, tone: "pend" };
}
