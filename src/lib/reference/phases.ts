/**
 * The four pre-accreditation phases and their documents, originally 18
 * verbatim from `docs/OtherContext.txt` "PRE-ACCREDITATION PHASES"
 * (5 + 5 + 4 + 4), plus MOA added to Phase 2 on 2026-09-19 (client meeting
 * backlog) for 19.
 *
 * These are the same for every level — the constant half of the readiness
 * denominator: this count + the level's own areas (BACKEND.md §2.1). Adding
 * MOA moved every level's total up by one from the O-17-confirmed 28/28/22/23
 * — see the migration that added it (20260919000100_moa_phase_document.sql)
 * and `plans/CLIENT-MEETING-TODOS.md`.
 *
 * `isOptional` marks "Site visit report (if conducted)". It still counts toward
 * the denominator — the level-card totals only work if it does — which is
 * open item O-3, flagged for confirmation rather than quietly resolved.
 */
export type PhaseSeed = {
  ordinal: number;
  name: string;
};

export type PhaseDocumentSeed = {
  /** Joins `phases.ordinal`. */
  phase: number;
  ordinal: number;
  name: string;
  isOptional: boolean;
};

export const PHASES: PhaseSeed[] = [
  { ordinal: 1, name: "Planning" },
  { ordinal: 2, name: "Implementation" },
  { ordinal: 3, name: "Monitoring" },
  { ordinal: 4, name: "Evaluation" },
];

export const PHASE_DOCUMENTS: PhaseDocumentSeed[] = [
  { phase: 1, ordinal: 1, name: "Notice of Meeting", isOptional: false },
  { phase: 1, ordinal: 2, name: "Minutes of the Meeting", isOptional: false },
  { phase: 1, ordinal: 3, name: "Project Proposal", isOptional: false },
  { phase: 1, ordinal: 4, name: "Action Plan", isOptional: false },
  { phase: 1, ordinal: 5, name: "Budget Proposal", isOptional: false },

  { phase: 2, ordinal: 1, name: "Approved Proposal", isOptional: false },
  { phase: 2, ordinal: 2, name: "Activity Program", isOptional: false },
  { phase: 2, ordinal: 3, name: "Attendance", isOptional: false },
  { phase: 2, ordinal: 4, name: "Photos", isOptional: false },
  { phase: 2, ordinal: 5, name: "Narrative Report", isOptional: false },
  { phase: 2, ordinal: 6, name: "Memorandum of Agreement (MOA)", isOptional: false },

  { phase: 3, ordinal: 1, name: "Monitoring Report", isOptional: false },
  { phase: 3, ordinal: 2, name: "Progress Report", isOptional: false },
  { phase: 3, ordinal: 3, name: "Monitoring Checklist", isOptional: false },
  { phase: 3, ordinal: 4, name: "Site visit report (if conducted)", isOptional: true },

  { phase: 4, ordinal: 1, name: "Evaluation Results", isOptional: false },
  { phase: 4, ordinal: 2, name: "Terminal Report", isOptional: false },
  { phase: 4, ordinal: 3, name: "Impact Assessment", isOptional: false },
  { phase: 4, ordinal: 4, name: "Recommendations", isOptional: false },
];
