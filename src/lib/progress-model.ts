import { areaLabel } from "@/lib/program-names";
import { includedAreas, missingChoices, type DocState } from "@/lib/review-model";
import type { QacProgram } from "@/lib/qac-model";

export type ReportState = "ack" | "submitted" | "returned" | "none";

export type ProgressArea = { name: string; state: DocState; remark?: string };
export type ProgressAccreditor = { name: string; accepted: boolean; report: ReportState; grandMean?: number | null };

export type ProgressInput = {
  accreditors: ProgressAccreditor[];
  areas: ProgressArea[];
  result?: string | null;
  visit?: string | null;
  /** The survey visit already passed: every stage counts as done. */
  completed?: boolean;
};

export type StageKey = "assigned" | "documents" | "review" | "result";

export const PROGRESS_STAGES: { key: StageKey; title: string; hint: string }[] = [
  { key: "assigned", title: "Scheduled & assigned", hint: "Both internal accreditors accepted" },
  { key: "documents", title: "Documents accepted", hint: "Accepted by the internal accreditors" },
  { key: "review", title: "QAC review", hint: "Signed reports acknowledged by QAC" },
  { key: "result", title: "Accreditation result", hint: "Visit result recorded" },
];

export type Progress = {
  /** 0–1 per stage; a stage only reaches 1 when the work is accepted. */
  fractions: number[];
  summaries: string[];
  percent: number;
  /** First unfinished stage, 4 once everything is done. */
  current: number;
  approved: number;
  total: number;
};

const NEEDED = 2;

/**
 * Four stages worth 25% each. A stage moves only when the next person ACCEPTS
 * the work, so an upload alone never counts. Pre-Accreditation Phases are
 * optional extension monitoring and are not part of the percentage.
 */
export function computeProgress(input: ProgressInput): Progress {
  const total = input.areas.length || 10;
  const approved = input.areas.filter((a) => a.state === "approved").length;
  const accepted = Math.min(input.accreditors.filter((a) => a.accepted).length, NEEDED);
  const acknowledged = Math.min(input.accreditors.filter((a) => a.report === "ack").length, NEEDED);
  const waiting = input.accreditors.filter((a) => a.report === "submitted").length;

  const done = Boolean(input.completed);
  const fractions = done ? [1, 1, 1, 1] : [accepted / NEEDED, approved / total, acknowledged / NEEDED, input.result ? 1 : 0];
  const summaries = done
    ? [`${NEEDED} of ${NEEDED} accepted`, `${total} of ${total} accepted`, `${NEEDED} of ${NEEDED} acknowledged`, input.result ?? "Passed"]
    : [
        `${accepted} of ${NEEDED} accepted`,
        `${approved} of ${total} accepted`,
        `${acknowledged} of ${NEEDED} acknowledged${waiting > 0 ? ` · ${waiting} waiting` : ""}`,
        input.result ?? "Not yet recorded",
      ];
  const percent = Math.round(fractions.reduce((sum, f) => sum + f * 25, 0));
  const first = fractions.findIndex((f) => f < 1);
  return { fractions, summaries, percent, current: first < 0 ? 4 : first, approved, total };
}

const reportState = (status: string | undefined): ReportState =>
  status === "acknowledged" ? "ack" : status === "submitted" ? "submitted" : status === "returned" ? "returned" : "none";

/** What QAC and admin see for a program that is in process. */
export function programProgressInput(p: QacProgram): ProgressInput {
  const slots = p.review ? includedAreas(p.review) : [];
  const areas: ProgressArea[] = slots.map((s) => ({
    name: areaLabel(s.name),
    state: s.state,
    remark: s.returnNote ?? undefined,
  }));
  const pending = p.review ? missingChoices(p.review) : 0;
  for (let i = 0; i < pending; i++) areas.push({ name: "Chosen area (not picked yet)", state: "missing" });

  return {
    accreditors: p.team
      .filter((m) => m.response !== "rejected")
      .map((m) => {
        const rep = p.reports.find((r) => r.accreditorId === m.id);
        return { name: m.name, accepted: m.response === "accepted", report: reportState(rep?.status), grandMean: rep?.grandMean ?? null };
      }),
    areas,
    result: p.result,
    visit: p.visitLabel,
  };
}

export const programPercent = (p: QacProgram) => computeProgress(programProgressInput(p)).percent;
