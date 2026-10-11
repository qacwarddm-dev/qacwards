import type { TeamRole } from "@/lib/team-model";
import {
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

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  response: string;
  me: boolean;
  leader: boolean;
  sentAt: string | null;
  report: ReportState | null;
};

export type TeamMate = { id: string; name: string; short: string; response: string };

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
  role: TeamRole;
  /** Area ids the viewer rates; every other area of the level is the teammate's, view only. */
  mine: string[];
  leaderAreaIds: string[];
  mate: TeamMate | null;
  mySentAt: string | null;
  mateSentAt: string | null;
  review: SubmissionReview | null;
  /** Ratings of every area, taken from whichever accreditor owns it. */
  ratings: AreaRatings;
  /** The one overall report, signed by the Team Leader. */
  report: ReportState | null;
  awardedCodes: string[];
};

export const MIN_DOCS_PCT = 10;

export function iaStats(a: IaAssignment) {
  const r = a.review;
  const none = {
    docsPct: 0,
    evalN: 0,
    evalPct: 0,
    pending: 0,
    returned: 0,
    ready: false,
    areaTotal: 0,
    areaCounts: countSlots([]),
    started: false,
    mateN: 0,
    mateTotal: 0,
    mineDone: false,
    allDone: false,
    canSend: false,
  };
  if (!r) return none;
  const areas = includedAreas(r);
  const mine = areas.filter((s) => a.mine.includes(s.refId));
  const theirs = areas.filter((s) => !a.mine.includes(s.refId));
  const evaluated = (s: (typeof areas)[number]) => s.state === "approved" && ratedCount(a.ratings[s.refId]) === 3;
  const all = countSlots(areas);
  const own = countSlots(mine);
  const evalN = mine.filter(evaluated).length;
  const mateN = theirs.filter(evaluated).length;
  const mineDone = evalN === mine.length;
  const allDone = mineDone && mateN === theirs.length;
  const mateReady = !a.mate || (a.mate.response === "accepted" && Boolean(a.mateSentAt));
  const started = mine.some((s) => s.state === "approved" || s.state === "returned") || mine.some((s) => Object.keys(a.ratings[s.refId] ?? {}).length > 0);
  return {
    docsPct: all.pct,
    evalN,
    evalPct: mine.length ? Math.round((evalN / mine.length) * 100) : 0,
    pending: own.pe,
    returned: own.re,
    ready: a.role === "leader" ? allDone && mateReady : mineDone,
    areaTotal: mine.length,
    areaCounts: own,
    started,
    mateN,
    mateTotal: theirs.length,
    mineDone,
    allDone,
    canSend: a.role === "assistant" && mineDone && !a.mySentAt,
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
