// Imported by both the client form and the server action; nothing here may
// import server-only code.

export type VisitEvaluationKind = "qac_service" | "internal_accreditor";

export type AutoField =
  | "email"
  | "evaluator"
  | "designation"
  | "campus"
  | "program"
  | "accreditor"
  | "date";

export type Question =
  | {
      kind: "choice";
      key: string;
      label: string;
      options: string[];
      required?: boolean;
      prefillVisit?: boolean;
      mustAgree?: boolean;
    }
  | { kind: "scale"; key: string; label: string; hint: string; rows: string[] }
  | { kind: "score"; key: string; label: string; hint: string; max: number }
  | { kind: "text"; key: string; label: string }
  | { kind: "auto"; key: AutoField; label: string };

export type SurveyStep = { name: string; questions: Question[] };

export type SurveyForm = {
  kind: VisitEvaluationKind;
  title: string;
  subtitle: string;
  steps: SurveyStep[];
};

export type ScaleAnswer = Record<string, number>;
export type Answers = Record<string, string | ScaleAnswer>;
export type AutoValues = Record<AutoField, string>;

export const SCALE = [5, 4, 3, 2, 1] as const;

const QAC_VISITS = [
  "Preliminary Survey Visit",
  "Level 1 Visit",
  "Level 2 Visit",
  "Level 3 Phase 1 Visit",
  "Level 3 Phase 2 Visit",
  "Level 4 Phase 1 Visit",
  "Level 4 Phase 2 Visit",
  "Application for Certificate of Program Compliance (COPC)",
  "Other",
];

const IA_VISITS = [
  "Preliminary Survey Visit",
  "Level 1 Visit",
  "Level 2 Visit",
  "Level 3 Phase 2 Visit",
  "Level 4 Phase 2 Visit",
  "Other",
];

const SATISFACTION_HINT = "5 = Extremely satisfied, 1 = Not satisfied at all";

export const SURVEY_FORMS: Record<VisitEvaluationKind, SurveyForm> = {
  qac_service: {
    kind: "qac_service",
    title: "QAC Service Evaluation",
    subtitle: "For the actual accreditation visit and other assistance from the QA Center",
    steps: [
      {
        name: "Visit",
        questions: [
          {
            kind: "choice",
            key: "visit",
            label: "For actual accreditation visit and other assistance",
            options: QAC_VISITS,
            required: true,
            prefillVisit: true,
          },
          { kind: "auto", key: "email", label: "Email" },
        ],
      },
      {
        name: "Assistance",
        questions: [
          {
            kind: "scale",
            key: "assistance",
            label: "How satisfied are you with the assistance you received?",
            hint: SATISFACTION_HINT,
            rows: ["Usefulness", "Relevance", "Responsiveness", "Clarity", "Impact"],
          },
        ],
      },
      {
        name: "Staff",
        questions: [
          {
            kind: "scale",
            key: "staff",
            label: "How satisfied are you with the manner of the staff?",
            hint: SATISFACTION_HINT,
            rows: [
              "Courtesy",
              "Promptness",
              "Friendliness",
              "Sensitivity to client's needs",
              "Helpfulness",
            ],
          },
        ],
      },
      {
        name: "Finish",
        questions: [
          { kind: "text", key: "comments", label: "Comments and suggestions" },
          { kind: "auto", key: "evaluator", label: "Name of evaluator" },
          { kind: "auto", key: "designation", label: "Designation / academic rank" },
          { kind: "auto", key: "campus", label: "Branch / campus" },
          { kind: "auto", key: "date", label: "Date accomplished" },
        ],
      },
    ],
  },
  internal_accreditor: {
    kind: "internal_accreditor",
    title: "Internal Accreditor Evaluation",
    subtitle: "Help the QA Center evaluate the internal accreditors who visited your program",
    steps: [
      {
        name: "Consent",
        questions: [
          {
            kind: "choice",
            key: "consent",
            label:
              "I agree to let the QA Center collect and process my personal information in line with the Data Privacy Act of 2012.",
            options: ["Yes", "No"],
            required: true,
            mustAgree: true,
          },
        ],
      },
      {
        name: "Visit",
        questions: [
          { kind: "auto", key: "email", label: "Email" },
          { kind: "auto", key: "accreditor", label: "Name of internal accreditor" },
          { kind: "auto", key: "program", label: "Academic program visited / campus / college" },
          {
            kind: "choice",
            key: "visit",
            label: "Level of accreditation visit",
            options: IA_VISITS,
            required: true,
            prefillVisit: true,
          },
        ],
      },
      {
        name: "Rating",
        questions: [
          {
            kind: "choice",
            key: "expertise",
            label: "Quality of work / expertise (50%)",
            options: [
              "Exemplary (45-50)",
              "Proficient (37-44)",
              "Developing (25-36)",
              "Unsatisfactory (0-24)",
            ],
            required: true,
          },
          {
            kind: "score",
            key: "commitment",
            label: "Commitment / responsibility (25%)",
            hint: "Score from 0 to 25",
            max: 25,
          },
          {
            kind: "score",
            key: "professionalism",
            label: "Professionalism (25%)",
            hint: "Score from 0 to 25",
            max: 25,
          },
          { kind: "text", key: "comments", label: "Comments and suggestions" },
        ],
      },
      {
        name: "Finish",
        questions: [
          { kind: "auto", key: "evaluator", label: "Name of evaluator" },
          { kind: "auto", key: "designation", label: "Designation / academic rank" },
          { kind: "auto", key: "campus", label: "Campus" },
          { kind: "auto", key: "date", label: "Date accomplished" },
        ],
      },
    ],
  },
};

const VISIT_BY_LEVEL: Record<string, string> = {
  PSV: "Preliminary Survey Visit",
  I: "Level 1 Visit",
  II: "Level 2 Visit",
};

export function visitLabelForLevel(code: string): string {
  return VISIT_BY_LEVEL[code] ?? "Other";
}

export function initialAnswers(form: SurveyForm, visit: string, saved: Answers): Answers {
  const next: Answers = { ...saved };
  for (const step of form.steps) {
    for (const q of step.questions) {
      if (q.kind === "choice" && q.prefillVisit && next[q.key] === undefined && q.options.includes(visit)) {
        next[q.key] = visit;
      }
    }
  }
  return next;
}

export type StepProblem = { key: string; rows?: number[]; message: string };

export function stepProblems(step: SurveyStep, answers: Answers): StepProblem[] {
  const problems: StepProblem[] = [];
  for (const q of step.questions) {
    const value = answers[q.key];
    if (q.kind === "choice" && q.required) {
      if (typeof value !== "string" || !q.options.includes(value)) {
        problems.push({ key: q.key, message: q.mustAgree ? "You need to agree before you can continue." : "Please choose one." });
      } else if (q.mustAgree && value !== "Yes") {
        problems.push({ key: q.key, message: "You need to agree before you can continue." });
      }
    }
    if (q.kind === "scale") {
      const rated = (typeof value === "object" ? value : {}) as ScaleAnswer;
      const rows = q.rows.map((_, i) => i).filter((i) => !SCALE.includes(rated[i] as (typeof SCALE)[number]));
      if (rows.length > 0) problems.push({ key: q.key, rows, message: "Please rate every item." });
    }
    if (q.kind === "score") {
      const n = typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
      if (!Number.isInteger(n) || n < 0 || n > q.max) {
        problems.push({ key: q.key, message: `Enter a whole number from 0 to ${q.max}.` });
      }
    }
  }
  return problems;
}

export function formProblems(form: SurveyForm, answers: Answers): StepProblem[] {
  return form.steps.flatMap((s) => stepProblems(s, answers));
}

/** Drops anything the form does not ask, so a crafted payload cannot smuggle
 *  extra keys into the stored row. */
export function sanitizeAnswers(form: SurveyForm, answers: Answers): Answers {
  const clean: Answers = {};
  for (const step of form.steps) {
    for (const q of step.questions) {
      const value = answers[q.key];
      if (q.kind === "auto" || value === undefined) continue;
      if (q.kind === "scale") {
        if (typeof value !== "object") continue;
        const rated: ScaleAnswer = {};
        q.rows.forEach((_, i) => {
          const n = (value as ScaleAnswer)[i];
          if (SCALE.includes(n as (typeof SCALE)[number])) rated[i] = n;
        });
        clean[q.key] = rated;
      } else if (typeof value === "string") {
        clean[q.key] = value.slice(0, 2000);
      }
    }
  }
  return clean;
}
