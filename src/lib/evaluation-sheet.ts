/**
 * QAC FORM NO.005 — the Internal (Simulation) Accreditation Visit Evaluation
 * Sheet, one template per level group, transcribed from
 * assets/OTHERS/IA EVALUATION SHEET-*.docx.pdf. Shared by the on-screen form
 * and the PDF renderer so the two cannot disagree on a label.
 */

export type SheetTemplateKey = "l12" | "l3" | "l4";

export type SheetSection = {
  key: string;
  label: string;
  /** Level III's Areas 3 and 4 are the programme's two chosen areas; the sheet
   *  prints "(CHOSEN AREA) ____" with the name written on the blank. */
  chosenAreaKey?: string;
  /** Sections sharing a group print inside one bordered cell on the PDF. */
  group: string;
  indent?: boolean;
  /** Level III's Research box applies to graduate programmes only. */
  optional?: boolean;
};

export type SheetTemplate = {
  key: SheetTemplateKey;
  titleLines: string[];
  /** Pre-printed on the Level III/IV sheets; blank (filled from the level) on I–II. */
  fixedLevelLine: string | null;
  sections: SheetSection[];
  reminders: string[];
};

const BASE_REMINDERS = [
  "Remember not to leave an item in your documentation/report blank. No parameter/benchmark statement should be left unanswered.",
  "Photos/reports/evidence/proofs/exhibits should be clearly scanned.  Avoid presenting blurred documents. Always make sure that your reports/proofs/evidence/exhibits are readable.  If original documents are blurred, be sure that they are at the same time readable when magnified.",
  "Avoid the use of repeated documents that are not necessarily essential/ required in each benchmark statement.",
  "Avoid showing documents/evidence without brief descriptions about what is presented.  In this manner, your accreditor/s will be guided and oriented about the documents being assessed.",
  "Photos used need complete details when putting captions.  This should include the title of the activity, the date when the activity was held, the persons involved, and a short description/story about the pictures exhibited.",
  "For easier reference and presentation of documents it is suggested to summarize data in a matrix before attaching evidence to your report/document.  For ease of facility, summary schedules and matrices of reports are essential.",
  "Photos as much as possible should only be used one time but not repeatedly.  Might as well scatter them in your documentation for SIO.",
  "The resolution of the photos used should be clear and vivid.",
  "Be sure that all documents presented are signed by proper authorities.",
];

const LATER_REMINDERS = (item7: string) => [
  BASE_REMINDERS[0],
  BASE_REMINDERS[1],
  BASE_REMINDERS[2],
  BASE_REMINDERS[3],
  BASE_REMINDERS[4],
  "For easier reference and presentation of documents, it is suggested to summarize data in a matrix before attaching evidence to your report/document.  For ease of facility, summary schedules and matrices of reports are essential.",
  item7,
  BASE_REMINDERS[7],
  "Be sure that all documents presented are signed by the proper authorities.",
];

const L12_AREAS = [
  "VISION, MISSION, GOALS, AND OBJECTIVES",
  "FACULTY",
  "CURRICULUM AND INSTRUCTIONS",
  "SUPPORT TO STUDENTS",
  "RESEARCH",
  "EXTENSION AND COMMUNITY INVOLVEMENT",
  "LIBRARY",
  "PHYSICAL PLANT AND FACILITIES",
  "LABORATORIES",
  "ADMINISTRATION",
];

const L4_AREAS = [
  "INSTRUCTION",
  "RESEARCH",
  "EXTENSION AND COMMUNITY INVOLVEMENT",
  "INTERNATIONALIZATION (LINKAGES AND CONSORTIA)",
  "WELL-DEVELOPED PLANNING",
];

export const SHEET_TEMPLATES: Record<SheetTemplateKey, SheetTemplate> = {
  l12: {
    key: "l12",
    titleLines: ["INTERNAL (SIMULATION) ACCREDITATION VISIT", "EVALUATION SHEET"],
    fixedLevelLine: null,
    sections: [
      ...L12_AREAS.map((name, i) => ({
        key: `area${i + 1}`,
        label: `Area ${i + 1}: ${name}`,
        group: "areas",
      })),
      { key: "compliance", label: "COMPLIANCE REPORT", group: "compliance" },
      {
        key: "narrative",
        label: "PROGRAM PERFORMANCE PROFILE (PPP)/ NARRATIVE PROFILE",
        group: "narrative",
      },
    ],
    reminders: BASE_REMINDERS,
  },
  l3: {
    key: "l3",
    titleLines: [
      "INTERNAL (SIMULATION) ACCREDITATION VISIT",
      "FOR UNDERGRADUATE PROGRAM",
      "EVALUATION SHEET",
    ],
    fixedLevelLine: "Level III Accreditation Visit",
    sections: [
      { key: "av", label: "AUDIO-VIDEO PRESENTATION:", group: "av" },
      { key: "area1", label: "Area 1: INSTRUCTION (Mandatory Area)", group: "area1" },
      {
        key: "area2",
        label:
          "Area 2: EXTENSION AND COMMUNITY INVOLVEMENT (Mandatory Area for Undergraduate)",
        group: "area2",
      },
      {
        key: "research",
        label: "RESEARCH (Mandatory Area for Graduate)",
        group: "area2",
        indent: true,
        optional: true,
      },
      { key: "area3", label: "Area 3: (CHOSEN AREA)", chosenAreaKey: "area3Name", group: "area3" },
      { key: "area4", label: "Area 4: (CHOSEN AREA)", chosenAreaKey: "area4Name", group: "area4" },
      { key: "compliance", label: "COMPLIANCE REPORT", group: "compliance" },
      { key: "narrative", label: "NARRATIVE PROFILE", group: "narrative" },
    ],
    reminders: LATER_REMINDERS(
      "Photos should be used as much as possible, only once, but not repeatedly.  Might as well scatter them in your documentation for SIO.",
    ),
  },
  l4: {
    key: "l4",
    titleLines: ["INTERNAL (SIMULATION) ACCREDITATION VISIT", "EVALUATION SHEET"],
    fixedLevelLine: "Level IV Accreditation Visit",
    sections: [
      ...L4_AREAS.map((name, i) => ({
        key: `area${i + 1}`,
        label: `Area ${i + 1}: ${name} -`,
        group: "areas",
      })),
      { key: "compliance", label: "COMPLIANCE REPORT -", group: "compliance" },
      { key: "narrative", label: "NARRATIVE PROFILE -", group: "narrative" },
    ],
    reminders: LATER_REMINDERS(
      "Photos, as much as possible, should only be used once, but not repeatedly.  Might as well scatter them in your documentation for SIO.",
    ),
  },
};

/** Client's mapping (docs/internal_accreditor.pdf p.3); PSV uses the I–II sheet
 *  by the owner's call on 2026-09-27. */
export function templateForLevel(levelCode: string | null): SheetTemplate {
  if (levelCode === "III") return SHEET_TEMPLATES.l3;
  if (levelCode === "IV") return SHEET_TEMPLATES.l4;
  return SHEET_TEMPLATES.l12;
}

export function levelLine(levelCode: string | null, levelName: string): string {
  const fixed = templateForLevel(levelCode).fixedLevelLine;
  if (fixed) return fixed;
  return levelCode === "PSV" ? levelName : `${levelName} Accreditation Visit`;
}

export type SheetValues = Record<string, string>;

export const HEADER_KEYS = {
  address: "address",
  visitDate: "visitDate",
  areasEvaluated: "areasEvaluated",
} as const;

/** Every answer box on the sheet, header fields included — "finished" means
 *  none of these is blank, per the sheet's own Reminder no. 1. */
export function requiredKeys(template: SheetTemplate): string[] {
  return [
    HEADER_KEYS.visitDate,
    HEADER_KEYS.areasEvaluated,
    ...template.sections
      .filter((s) => !s.optional)
      .flatMap((s) => (s.chosenAreaKey ? [s.chosenAreaKey, s.key] : [s.key])),
  ];
}

export function missingKeys(template: SheetTemplate, values: SheetValues): string[] {
  return requiredKeys(template).filter((k) => !values[k]?.trim());
}

/** Today's calendar date in Manila as `YYYY-MM-DD` (O-20: dates are Manila days,
 *  whatever zone the server or browser runs in). */
export function manilaToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function isEvaluationOpen(siteVisitDate: string | null, now: Date = new Date()): boolean {
  return siteVisitDate !== null && manilaToday(now) >= siteVisitDate;
}

export function formatLongDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
