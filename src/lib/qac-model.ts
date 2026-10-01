import { allPhaseSlots, countSlots, includedAreas, type SubmissionReview } from "@/lib/review-model";

export type QacMember = { id: string; name: string; surname: string; initials: string; response: string; acting: string | null };

export type QacReport = {
  accreditorId: string;
  status: "draft" | "submitted" | "acknowledged" | "returned";
  grandMean: number | null;
  signedAt: string | null;
  code: string | null;
  qacNote: string | null;
  findings: string;
  recommendation: string;
};

export type QacProgram = {
  id: string;
  name: string;
  short: string;
  mid: string;
  college: string;
  collegeName: string;
  campus: string;
  isMain: boolean;
  levelCode: string;
  levelName: string;
  levelId: string;
  inproc: boolean;
  submissionId: string | null;
  submissionStatus: string | null;
  assignmentId: string | null;
  assignmentStatus: string | null;
  visit: string | null;
  visitLabel: string;
  due: string | null;
  team: QacMember[];
  rep: string;
  review: SubmissionReview | null;
  reports: QacReport[];
  rated: Record<string, number>;
  areaMeans: Record<string, Record<string, number>>;
  remarks: Record<string, Record<string, string[]>>;
  result: string | null;
  from: string | null;
  to: string | null;
  copc: boolean;
  awardedCodes: string[];
};

export const LVS: [string, string, string][] = [
  ["PSV", "PSV", "Preliminary Survey Visit"],
  ["I", "LEVEL I", "Level I"],
  ["II", "LEVEL II", "Level II"],
  ["III", "LEVEL III", "Level III"],
  ["IV", "LEVEL IV", "Level IV"],
];

export const levelName = (code: string) => LVS.find((l) => l[0] === code)?.[2] ?? code;

export function daysTo(iso: string | null, today: string) {
  if (!iso) return 0;
  return Math.round((new Date(iso.slice(0, 10)).getTime() - new Date(today).getTime()) / 864e5);
}

export function readiness(p: QacProgram) {
  if (!p.review) return 0;
  return countSlots([...allPhaseSlots(p.review), ...includedAreas(p.review)]).pct;
}

export type Tone = "ok" | "pend" | "ret" | "miss" | "blue";

export function qacStatus(p: QacProgram, today: string): { t: string; c: Tone } {
  if (!p.inproc) {
    const d = daysTo(p.to, today);
    return !p.to ? { t: "Accredited", c: "ok" } : d < 0 ? { t: "Expired", c: "ret" } : d <= 183 ? { t: "Expiring soon", c: "pend" } : { t: "Accredited", c: "ok" };
  }
  if (p.result) return { t: "Visit passed", c: "ok" };
  const active = p.team.filter((m) => m.response !== "rejected");
  if (active.length < 2) return { t: active.length ? "Needs 1 more accreditor" : "Needs accreditors", c: "ret" };
  if (active.some((m) => m.response === "pending")) return { t: "Awaiting acceptance", c: "miss" };
  if (p.reports.length && active.every((m) => p.reports.find((r) => r.accreditorId === m.id)?.status === "acknowledged")) return { t: "Evaluation acknowledged", c: "ok" };
  if (p.reports.some((r) => r.status === "submitted")) return { t: "For QAC review", c: "blue" };
  if (readiness(p) < 10) return { t: "Waiting for documents", c: "miss" };
  return { t: "In evaluation", c: "pend" };
}

export const phaseCounts = (p: QacProgram) => countSlots(p.review ? allPhaseSlots(p.review) : []);
