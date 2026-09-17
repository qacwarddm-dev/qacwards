import type { StatusKey } from "@/components/portal/kit";

/**
 * Extension Monitoring — net-new module from the client's 2026-09 frames
 * (assets/new frames/QAC/Externsion Monitoring/0-5.png). There is no
 * `extension_*` table yet (nothing in database.types.ts), so this is the
 * same "presentational screen over realistic fixture data" starting point
 * the whole portal shipped from in phase 3a, kept in its own module so the
 * eventual backend swap is a page-level change (CLAUDE.md's component-kit
 * rule extended to this lib layer) rather than a rewrite of the screens.
 *
 * Flagged here rather than silently faked, matching the project's O-7/O-22
 * convention for "this exists in the frame but not in the schema yet."
 */

export type ExtensionProgram = {
  id: string;
  program: string;
  campus: string;
  level: string;
  percent: number;
};

export type ExtensionPhaseNumber = 1 | 2 | 3 | 4;

export type ExtensionPhase = {
  number: ExtensionPhaseNumber;
  title: string;
  percent: number;
  status: StatusKey;
  missingDocuments: number;
  lastModified: string | null;
  document?: { title: string };
};

export type ExtensionProgramDetail = ExtensionProgram & {
  phases: ExtensionPhase[];
};

const PROGRAMS: ExtensionProgramDetail[] = [
  {
    id: "bscs",
    program: "Bachelor of Science in Computer Science",
    campus: "Sta. Mesa, Manila",
    level: "Level II",
    percent: 32,
    phases: [
      {
        number: 1,
        title: "Phase 1 (Planning)",
        percent: 50,
        status: "phase_in_progress",
        missingDocuments: 0,
        lastModified: "September 17, 2026",
        document: { title: "Notice of Meeting" },
      },
      {
        number: 2,
        title: "Phase 2 (Implementation)",
        percent: 0,
        status: "not_started",
        missingDocuments: 5,
        lastModified: null,
      },
      {
        number: 3,
        title: "Phase 3 (Monitoring)",
        percent: 0,
        status: "not_started",
        missingDocuments: 5,
        lastModified: null,
      },
      {
        number: 4,
        title: "Phase 4 (Evaluation)",
        percent: 0,
        status: "not_started",
        missingDocuments: 5,
        lastModified: null,
      },
    ],
  },
  {
    id: "bsit",
    program: "Bachelor of Science in Information Technology",
    campus: "Sta. Mesa, Manila",
    level: "Level II",
    percent: 54,
    phases: [
      {
        number: 1,
        title: "Phase 1 (Planning)",
        percent: 100,
        status: "evaluated",
        missingDocuments: 0,
        lastModified: "September 10, 2026",
        document: { title: "Notice of Meeting" },
      },
      {
        number: 2,
        title: "Phase 2 (Implementation)",
        percent: 65,
        status: "phase_in_progress",
        missingDocuments: 2,
        lastModified: "September 15, 2026",
        document: { title: "Notice of Meeting" },
      },
      {
        number: 3,
        title: "Phase 3 (Monitoring)",
        percent: 0,
        status: "not_started",
        missingDocuments: 5,
        lastModified: null,
      },
      {
        number: 4,
        title: "Phase 4 (Evaluation)",
        percent: 0,
        status: "not_started",
        missingDocuments: 5,
        lastModified: null,
      },
    ],
  },
];

export async function getExtensionPrograms(): Promise<ExtensionProgram[]> {
  return PROGRAMS.map((p) => ({
    id: p.id,
    program: p.program,
    campus: p.campus,
    level: p.level,
    percent: p.percent,
  }));
}

export async function getExtensionProgram(id: string): Promise<ExtensionProgramDetail | null> {
  return PROGRAMS.find((p) => p.id === id) ?? null;
}
