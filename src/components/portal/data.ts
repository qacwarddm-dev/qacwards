/**
 * Fake content for the static portal screens, transcribed from the client's
 * Figma frames. This whole file is the swap point when the backend lands —
 * nothing else needs to change (plans/03a-portal-ui-static.md).
 */
import type { Step } from "./kit";
import type { PortalUser } from "./portal-nav";

export const QAC_SEAL = "/assets/logos/qac.png";

/**
 * One fake signed-in person per role, keyed by *user*. The keys happen to read
 * like role slugs only because there is exactly one fake user per role today —
 * `PortalUserKey` is intentionally not `PortalRole`, so a second QAC Personnel
 * account later is a new entry rather than a rewrite of the seam.
 *
 * `qac_admin` has no entry: assets/FIGMA/qac_admin/ is empty and the role is out
 * of scope for this phase, so inventing a person for it would be a guess.
 *
 * Every frame draws the literal words "Surname, Given Name M.I." and "Position"
 * in the top bar. The name stays as the prototype has it, but the owner asked
 * (2026-07-26) that `position` name the role whose frames you are looking at,
 * so the bar identifies which portal is on screen instead of repeating a word.
 * These are the same three labels the register form offers in SYSTEM_ROLES.
 * Avatars were lifted from each role's 01-Dashboard frame at 2x.
 */
export const PORTAL_USERS = {
  qac_personnel: {
    role: "qac_personnel",
    name: "Surname, Given Name M.I.",
    position: "QAC Personnel",
    avatar: "/assets/portal/avatar-placeholder.png",
    notifications: 1,
  },
  internal_accreditor: {
    role: "internal_accreditor",
    name: "Surname, Given Name M.I.",
    position: "Internal Accreditor",
    avatar: "/assets/portal/avatar-internal-accreditor.png",
    notifications: 1,
  },
  program_representative: {
    role: "program_representative",
    name: "Surname, Given Name M.I.",
    position: "Program Representative",
    avatar: "/assets/portal/avatar-program-representative.png",
    notifications: 1,
  },
} satisfies Record<string, PortalUser>;

export type PortalUserKey = keyof typeof PORTAL_USERS;

/** Who you are when no dev cookie is set — the only role with built screens. */
export const DEFAULT_PORTAL_USER: PortalUserKey = "qac_personnel";

/**
 * Notifications shown in the top-bar bell panel
 * (qac_personnel/interactables/overall-notifications-button). `name`, when set,
 * is the bold lead-in before `body`; the third item is body-only. `unread`
 * draws the grey highlight row and the trailing blue dot.
 */
export type PortalNotification = {
  id: string;
  avatar: string;
  /** Bold lead-in; omit for a body-only line. */
  name?: string;
  body: string;
  time: string;
  section: "new" | "earlier";
  unread?: boolean;
  /** Where clicking the row goes. Written by the trigger that raised it. */
  href?: string;
};

/* B8 replaced the fake NOTIFICATIONS list with `getNotifications()`
 * (src/lib/notifications.ts). The type stays here because it is the bell's prop
 * shape, which the Figma frame defines and the database does not. */

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[(),.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Satellite campuses — 22 folders, all carrying the QAC seal. */
export const CAMPUSES = [
  "Alfonso, Cavite",
  "Bansud, Oriental Mindoro",
  "Biñan, Laguna",
  "Cabiao, Nueva Ecija",
  "Calauan, Laguna",
  "General Luna, Quezon",
  "Lopez, Quezon",
  "Maragondon, Cavite",
  "Mariveles, Bataan",
  "Mulanay, Quezon",
  "Parañaque City",
  "Pulilan, Bulacan",
  "Quezon City",
  "Ragay, Camarines Sur",
  "Sablayan, Occidental Mindoro",
  "San Juan City",
  "San Pedro, Laguna",
  "Sta. Maria, Bulacan",
  "Sta. Rosa, Laguna",
  "Sto. Tomas, Batangas",
  "Taguig City",
  "Unisan, Quezon",
].map((name) => ({ name, slug: slug(name), badge: QAC_SEAL }));

/** Main-campus colleges. Seal filenames match assets/LOGO/COLLEGES. */
export const COLLEGES = [
  ["College of Accountancy and Finance (CAF)", "caf"],
  ["College of Architecture, Design and the Built Environment (CADBE)", "cadbe"],
  ["College of Arts and Letters (CAL)", "cal"],
  ["College of Business Administration (CBA)", "cba"],
  ["College of Computer and Information Science (CCIS)", "ccis"],
  ["College of Communication (COC)", "coc"],
  ["College of Education (COED)", "coed"],
  ["College of Engineering (CE)", "ce"],
  ["College of Human Kinetics (CHK)", "chk"],
  ["College of Political Science and Public Administration (CPSPA)", "cpspa"],
  ["College of Science (CS)", "cs"],
  ["College of Social Science and Development (CSSD)", "cssd"],
  ["College of Tourism, Hospitality, and Transport Management (CTHTM)", "cthtm"],
  ["Graduate School (GS)", "gs"],
].map(([name, code]) => ({
  name,
  slug: code,
  badge: `/assets/colleges/${code}.png`,
}));

/**
 * Truncated lists revealed in the Documents landing card hover overlay
 * (qac_personnel/interactables/Documents-MainCampus-HoverState and
 * Docuents-Campuses-HoverState). Transcribed from the frames: the college list
 * differs from COLLEGES above (the prototype writes "COEd" and adds "ITECH"),
 * and the campus list is the first 19 short names with "See More" for the rest,
 * so both are stored verbatim rather than derived.
 */
export const DOC_COVER_PREVIEW: Record<string, string> = {
  "main-campus":
    "CAF, CADBE, CAL, CBA, CCIS, COC, COEd, CE, CHK, CPSPA, CS, CSSD, CTHTM, GS, ITECH",
  campuses:
    "Alfonso, Bansud, Biñan, Cabiao, Calauan, General Luna, Lopez, Maragondon, Mariveles, Mulanay, Parañaque City, Pulilan, Quezon City, Ragay, Sablayan, San Juan City, San Pedro, Sta. Maria, Sta. Rosa",
};

/** The six document folders inside every campus and college. */
export const DOCUMENT_FOLDERS = [
  { name: "AACCUP Certificate", badge: "/assets/logos/aaccup.png" },
  {
    name: "AACCUP Summary of Findings and Recommendation",
    badge: "/assets/logos/aaccup.png",
  },
  { name: "AACCUP Technical Review", badge: "/assets/logos/aaccup.png" },
  {
    name: "Certificate of Compliance (COPC) Certificate",
    badge: "/assets/logos/ched.png",
  },
  {
    name: "Certificate of Compliance (COPC) Evaluation",
    badge: "/assets/logos/ched.png",
  },
  { name: "Other Files", badge: QAC_SEAL },
].map((f) => ({ ...f, slug: slug(f.name) }));

export const ASSIGNMENT_STEPS: Step[] = [
  { label: "Assigned", done: true },
  { label: "File Uploaded", done: true },
  { label: "For Preliminary Survey Visit" },
  { label: "Program Evaluated" },
  { label: "Return Score" },
];

/* This task replaced ASSIGNMENTS — `/portal/assignment`'s QAC Personnel
 * branch now reads `getAssignments()` (src/lib/assignments.ts), same as the
 * Internal Accreditor branch already did. */

/* Task 2 replaced NEW_ASSIGNMENT_FIELDS and ELIGIBLE_ACCREDITORS —
 * `/portal/assignment/new/page.tsx` now loads real campuses/colleges/programs
 * and `fetchEligibleAccreditors()` (src/lib/assignment-actions.ts). */

/* Task 6 replaced REPORT_STATS with `getReportsStats()` (src/lib/dashboards.ts) — decision 18.
 * REPORTS had no real backing (there is no `reports` table); `/portal/reports` now shows the
 * honest empty state instead. */

/* B9 replaced DASHBOARD_STATS with `getQacDashboard()` (src/lib/dashboards.ts). */

/* Task 2 replaced EVENT_MONTH/EVENT_MARKS/EVENT_TITLES — `/portal/events` now
 * reads `getMonthEvents()` (src/lib/events.ts) through `EventsCalendar`. The
 * fake data marked every single day "vacant" (yellow) by default; real events
 * leave a day unmarked unless it actually carries one, so `CalendarLegend`'s
 * "Vacant Day" entry is currently unreachable — worth the owner's eye. */

/* ---------------------------------------------------------------------------
 * program_representative — assets/FIGMA/program_representative/01-Dashboard.png
 * ------------------------------------------------------------------------- */

/* B9 replaced PR_DASHBOARD_STATS, PR_ONGOING_ACCREDITATION, PR_CALENDAR_*,
 * PR_DOC_STATUS and PR_RECENT_UPLOADS with `getRepDashboard()` and
 * `getMiniCalendarData()` (src/lib/dashboards.ts). */

/**
 * program_representative/02-Documents.png — the Templates tab's landing state:
 * three level-selector cards. `total`/`breakdown` are the hover panel's copy
 * from 02.01-HoverState.png; `key` is the `?level=` slug that opens the
 * matching entry in `PR_LEVEL_TEMPLATES`.
 */
export const PR_LEVEL_CARDS = [
  {
    key: "psv-lvl2",
    label: "PSV - LEVEL II",
    description:
      "Template toolkit for Preliminary Survey Visit, Level I, and Level II requirements.",
    total: "28 REQUIRED TEMPLATE (Each)",
    breakdown: "18 Pre-Accreditation\n10 Accreditation Requirements",
  },
  {
    key: "level3",
    label: "LEVEL III",
    description: "Template toolkit for Level III accreditation requirements.",
    total: "22 REQUIRED TEMPLATE",
    breakdown: "18 Pre-Accreditation\n4 Accreditation Requirements",
  },
  {
    key: "level4",
    label: "LEVEL IV",
    description: "Template toolkit for Level IV accreditation requirements.",
    total: "23 REQUIRED TEMPLATE",
    breakdown: "18 Pre-Accreditation\n5 Accreditation Requirements",
  },
];

/**
 * Per-level document grids — 02.1-PSV-LVL2.png, 02.2-LVL3.png, 02.3-LVL4.png.
 * PSV/Level II shares the same ten Areas the Submission Requirements list uses
 * (`PR_REQUIREMENT_AREAS`); Level III groups its cards under two headings,
 * Level IV has none.
 */
export const PR_LEVEL_TEMPLATES: Record<
  string,
  { heading: string; sections: { title?: string; documents: string[] }[] }
> = {
  "psv-lvl2": {
    heading: "PRELIMINARY SURVEY VISIT, LEVEL I, & LEVEL II",
    sections: [
      {
        documents: [
          "Area I - VMGO",
          "Area II - Faculty",
          "Area III - Curriculum & Instruction",
          "Area IV - Support to Students",
          "AREA V - Research",
          "AREA VI - Extension & Community Involvement",
          "Area VII - Library",
          "Area VIII - Physical Plant & Facilities",
          "Area IX - Laboratories",
          "Area X - Administration",
        ],
      },
    ],
  },
  level3: {
    heading: "LEVEL III",
    sections: [
      { title: "MANDATORY", documents: ["Instruction", "Extension"] },
      {
        title: "With Two (2) Program Choices",
        documents: [
          "Faculty Development",
          "Research",
          "Licensure Exam",
          "Consortia or Linkages",
          "Library",
        ],
      },
    ],
  },
  level4: {
    heading: "LEVEL IV",
    sections: [
      {
        documents: [
          "Research",
          "Teaching and Learning",
          "Extension",
          "Internationalization",
          "Planning Process",
        ],
      },
    ],
  },
};

/** 04-CommonDocuments(NDAFiles).png — twelve placeholder tiles. */
export const PR_COMMON_DOCUMENTS = Array.from({ length: 12 }, () => "Document Name");

/**
 * 05-AccreditationFiles.png. The artwork is lifted from the frame at 2x —
 * folder and seal are one image because they are one drawing in the prototype.
 */
export const PR_ACCREDITATION_FOLDERS = [
  { label: "AACCUP Certificate", art: "/assets/portal/folders/aaccup-certificate.png" },
  { label: "AACCUP Summary of Findings and Recommendation", art: "/assets/portal/folders/aaccup-summary.png" },
  { label: "AACCUP Technical Review", art: "/assets/portal/folders/aaccup-technical-review.png" },
  { label: "Certificate of Compliance (COPC) Certificate", art: "/assets/portal/folders/copc-certificate.png" },
  { label: "Certificate of Compliance (COPC) Evaluation", art: "/assets/portal/folders/copc-evaluation.png" },
  { label: "Other Files", art: "/assets/portal/folders/other-files.png" },
];

/* ---------------------------------------------------------------------------
 * internal_accreditor — assets/FIGMA/internal_accreditor/
 * ------------------------------------------------------------------------- */

/* B9 replaced IA_DASHBOARD_STATS, IA_ASSIGNED_EVALUATIONS,
 * IA_EVALUATION_PROGRESS and IA_UPCOMING_SCHEDULE with `getIaDashboard()` and
 * `getUpcomingSchedule()` (src/lib/dashboards.ts). The frame's own header row
 * for the Evaluation Progress table reads "Program | Program | Level |
 * Readiness" — the first column's data is a campus, almost certainly a
 * client-side label slip (meant "Campus"); reproduced verbatim in
 * `InternalAccreditorDashboard.tsx` per house rule. */

/** 02-Accreditation.png — one row, accepted, awaiting nothing. */
export const IA_ASSIGNMENTS = [
  {
    id: "ia-a1",
    campus: "Sta. Mesa, Manila",
    college: "CCIS",
    program: "Bachelor of Science in Information Technology",
    level: "IV",
    status: "Accepted",
  },
];

/* Task 2 replaced IA_EVALUATIONS, IA_EVALUATION_STEPS, IA_NARRATIVE_DOCS,
 * IA_COMPLIANCE_AREAS and IA_EVALUATION_WEBSITE(_DONE) — `/portal/evaluation`
 * and `/portal/evaluation/[id]` now read `getMyEvaluationAssignments()` /
 * `getAssignmentDetail()` / `getEvaluation()` (src/lib/assignments.ts). The
 * "Best Practice" section that IA_NARRATIVE_DOCS partly stood in for is not
 * reproduced with real data — see the comment on `ensureEvaluationItems`
 * (src/lib/assignment-actions.ts) for why. */

/* ── Submissions (program_representative/07 + 08 frames) ─────────────────── */

/**
 * Readiness Scores, one tile per accreditation level. `status` is the caption
 * under the percentage; `missing` is the document count beside it.
 */
export const PR_READINESS = [
  { level: "PSV", percent: 100, status: "Ready for\nEvaluation", missing: 0 },
  { level: "LEVEL I", percent: 23, status: "In Progress", missing: 28 },
  { level: "LEVEL II", percent: 0, status: "Not Started", missing: 28 },
  { level: "LEVEL III", percent: 0, status: "Not Started", missing: 22 },
  { level: "LEVEL IV", percent: 0, status: "Not Started", missing: 23 },
];

/**
 * The five accreditation levels — Preliminary Survey Visit plus Level I–IV. A
 * level at 0% renders dimmed, which is exactly how the frames distinguish
 * "not started" rows — so there is no separate flag.
 */
export const PR_ACCREDITATION_LEVELS = [
  { label: "Preliminary Survey Visit", percent: 100 },
  { label: "Level I", percent: 23 },
  { label: "Level II", percent: 0 },
  { label: "Level III", percent: 0 },
  { label: "Level IV", percent: 0 },
];

/** Track under an expanded phase — 07.4-Submissions-Levels-Phases-DropDown.png. */
export const PR_PHASE_STEPS: Step[] = [
  { label: "Assigned", done: true },
  { label: "Documents\nSubmitted" },
  { label: "Completed" },
];

/** 07.3/07.4-Submission-...-Phases.png */
export const PR_PHASES = [
  { label: "Phase 1 (Planning)", percent: 45 },
  { label: "Phase 2 (Implementation)", percent: 0 },
  { label: "Phase 3 (Monitoring)", percent: 0 },
  { label: "Phase 4 (Evaluation)", percent: 0 },
];

/**
 * 07.6-Requirements-modal.png, Phases variant — clicking a phase row opens
 * an Add Document modal scoped to *that* phase's required checklist, not the
 * generic Document/Additional-Document pair the Requirements Area rows use.
 * Only Phase 1 (Planning)'s list is confirmed from the frame; Phases 2–4 have
 * no export yet, so `PhaseDocumentModal` falls back to a single generic
 * "Document" field for them rather than guessing their checklist.
 */
export const PR_PHASE_DOCUMENTS: Record<number, string[]> = {
  1: [
    "Notice of Meeting",
    "Minutes of the Meeting",
    "Project Proposal",
    "Action Plan",
    "Budget Proposal",
  ],
};

/**
 * 07.5-Submissions-Levels-Phases-Requirements.png — label-only rows, no bar,
 * laid out two columns of five. Same ten Areas as the PSV/Level II template
 * grid (`PR_LEVEL_TEMPLATES["psv-lvl2"]`).
 */
export const PR_REQUIREMENT_AREAS = [
  "Area I - VMGO",
  "Area II - Faculty",
  "Area III - Curriculum & Instruction",
  "Area IV - Support to Students",
  "AREA V - Research",
  "AREA VI - Extension & Community Involvement",
  "Area VII - Library",
  "Area VIII - Physical Plant & Facilities",
  "Area IX - Laboratories",
  "Area X - Administration",
];

/** 07-Submission-Main.png — the Submission flow's entry point. */
export const PR_PROGRAMS = [
  { slug: "bscs", label: "Bachelor of Science in Computer Science" },
  { slug: "bsit", label: "Bachelor of Science in Information Technology" },
];

/**
 * Profile screen content. One screen for every role: the owner's 2026-08-01
 * revision replaced the old header-card layout with four panels (Profile /
 * Personal Details over Account Access / Change Password), and the panels are
 * the same for everyone — only these values differ.
 *
 * **Personal Details is now display only.** Every field in the revision is
 * labelled "(Cannot be changed)", including Discipline Expertise, which used to
 * be an editable multi-select. Identity is fixed at registration; the two things
 * a user can still change here are the photo and the password.
 *
 * The frame prints "Academic Program" in System Role, the same filled example it
 * printed on the register form. The owner already ruled on that one: the real
 * values are the three roles in `register-options.ts` SYSTEM_ROLES, so that is
 * what these carry.
 *
 * Names stay as the literal "Surname / Given Name / M.I." the frames draw. Campus,
 * position and college text come from `register-options.ts`, which is real PUP
 * data rather than invented content.
 */
export type PortalProfile = {
  /** Full Name renders as three separate boxes, so it is stored split. */
  surname: string;
  givenName: string;
  middleInitial: string;
  systemRole: string;
  /** Omitted where the role has no campus — QAC Personnel sit in the centre, not
   *  on a campus, and the three-up row then runs two wide. */
  campus?: string;
  position: string;
  /** The wide field under the three-up row. It is Department for the campus
   *  roles and Discipline Expertise for an Internal Accreditor: same slot, own
   *  label, so the panel does not need a per-role branch. */
  wide: { label: string; value: string };
  webmail: string;
  createdOn: string;
};

export const PROFILES: Record<PortalUserKey, PortalProfile> = {
  qac_personnel: {
    surname: "Surname",
    givenName: "Given Name",
    middleInitial: "M.I.",
    systemRole: "QAC Personnel",
    position: "Position",
    wide: { label: "Department", value: "PUP Quality Assurance Center" },
    webmail: "example@pup.edu.ph",
    createdOn: "Account Created on May 2026",
  },
  program_representative: {
    surname: "Surname",
    givenName: "Given Name",
    middleInitial: "M.I.",
    systemRole: "Program Representative",
    campus: "Sta. Mesa, Manila",
    position: "Dean",
    wide: {
      label: "Department",
      value: "College of Computer and Information Sciences (CCIS)",
    },
    webmail: "example@pup.edu.ph",
    createdOn: "Account Created on May 2026",
  },
  internal_accreditor: {
    surname: "Surname",
    givenName: "Given Name",
    middleInitial: "M.I.",
    systemRole: "Internal Accreditor",
    campus: "Sta. Mesa, Manila",
    position: "Position",
    wide: {
      label: "Discipline Expertise",
      value:
        "Accountancy, Accounting and Finance, Administration and Governance, Anthropology",
    },
    webmail: "example@pup.edu.ph",
    createdOn: "Account Created on May 2026",
  },
};
