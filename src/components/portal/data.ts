/**
 * Fake content for the static portal screens, transcribed from the client's
 * Figma frames. This whole file is the swap point when the backend lands —
 * nothing else needs to change (plans/03a-portal-ui-static.md).
 */
import type { DayMark, MeetingKind, Stat, StatusBar, Step, Upload } from "./kit";
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
};

export const NOTIFICATIONS: PortalNotification[] = [
  {
    id: "n1",
    avatar: "/assets/portal/avatar-notif-1.png",
    name: "Juan Dela Cruz",
    body: "is assigned as your program accreditor.",
    time: "44m",
    section: "new",
  },
  {
    id: "n2",
    avatar: "/assets/portal/avatar-notif-2.png",
    name: "Juan Dela Cruz",
    body: "is assigned as your program accreditor.",
    time: "2d",
    section: "earlier",
    unread: true,
  },
  {
    id: "n3",
    avatar: "/assets/portal/avatar-notif-3.png",
    body: "Webmail is verified successfully.",
    time: "7d",
    section: "earlier",
  },
];

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

/** Files shown inside a populated folder. Every other folder renders empty. */
export const SAMPLE_FILES = [
  {
    name: "Bachelor of Science in Information Technology.pdf",
    thumbnail: "/assets/portal/doc-thumb-sample.png",
  },
];

export const ASSIGNMENT_STEPS: Step[] = [
  { label: "Assigned", done: true },
  { label: "File Uploaded", done: true },
  { label: "For Preliminary Survey Visit" },
  { label: "Program Evaluated" },
  { label: "Return Score" },
];

export const ASSIGNMENTS = [
  {
    id: "a1",
    campus: "Sta. Mesa, Manila",
    college: "CCIS",
    program: "Bachelor of Science in Information Technology",
    level: "IV",
    accreditor: "Dela Cruz, Pedro Juan B.",
    score: "Not yet released",
  },
  {
    id: "a2",
    campus: "Sta. Mesa, Manila",
    college: "CCIS",
    program: "Bachelor of Science in Information Technology",
    level: "IV",
    accreditor: "Dela Cruz, Pedro Juan B.",
    score: "Not yet released",
  },
];

/**
 * qac_personnel/03.1-Create new assignment.png — the form the "New" button opens.
 * Each field shows one selected value from the frame; the extra options are short
 * fakes so the wired dropdown has alternatives to reveal. `defaultValue` is the
 * frame's shown pick (Level pre-selects "IV", which is not the list's first item).
 */
export const NEW_ASSIGNMENT_FIELDS = {
  campus: {
    label: "Campus",
    defaultValue: "Sta. Mesa, Manila",
    options: ["Sta. Mesa, Manila", "Taguig City", "Quezon City", "San Juan City"],
  },
  department: {
    label: "Department",
    defaultValue: "College of Computer and Information Sciences",
    options: [
      "College of Computer and Information Sciences",
      "College of Engineering",
      "College of Science",
      "College of Business Administration",
    ],
  },
  program: {
    label: "Program",
    defaultValue: "Bachelor of Science in Information Technology",
    options: [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Information Systems",
    ],
  },
  level: { label: "Level", defaultValue: "IV", options: ["I", "II", "III", "IV"] },
};

/**
 * The "Eligible Accreditors" table on the same frame. Expertise is transcribed
 * verbatim, ellipsis and all, so the centred cells match the prototype exactly
 * (the frame clips the first and third rows).
 */
export const ELIGIBLE_ACCREDITORS = [
  {
    id: "ea1",
    name: "Santos, Mark Anthony R.",
    expertise: "Web Development, Cybersecurity, Software Enginee...",
  },
  {
    id: "ea2",
    name: "Reyes, Christine Joy R.",
    expertise: "UI/UX Design, Data Analytics, Digital Forensics",
  },
  {
    id: "ea3",
    name: "Torres, Adrian Kyle D.",
    expertise: "Network Administration, Cloud Computing, Internet...",
  },
];

export const REPORT_STATS: Stat[] = [
  { label: "ACADEMIC OFFERED", value: "232", note: "As of April 2025" },
  { label: "MAIN CAMPUS", value: "97", note: "As of April 2025" },
  { label: "CAMPUSES", value: "135", note: "As of April 2025" },
  { label: "WITH COPC", value: "212", note: "As of April 2025" },
  { label: "NOT ACCREDITABLE", value: "30", note: "As of April 2025" },
];

export const REPORTS = [
  {
    id: "r1",
    type: "Target Accreditation Status - 2027",
    modifiedBy: "Mendoza, Angela Mae D.",
    generated: "04/15/2026",
  },
];

export const DASHBOARD_STATS: Stat[] = [
  { label: "LEVEL I", value: "22", note: "1.10% Since last month", trend: true },
  { label: "LEVEL II", value: "42", note: "1.10% Since last month", trend: true },
  { label: "LEVEL III", value: "48", note: "1.10% Since last month", trend: true },
  { label: "LEVEL IV", value: "106", note: "1.10% Since last month", trend: true },
  { label: "OVERALL", value: "218", note: "As of March 2026" },
];

/** December 2025 as drawn in the prototype: mostly vacant, four holidays. */
export const EVENT_MONTH = new Date(2025, 11, 1);
export const EVENT_MARKS: Record<number, DayMark> = (() => {
  const marks: Record<number, DayMark> = {};
  for (let d = 1; d <= 31; d++) marks[d] = "vacant";
  for (const d of [8, 25, 30, 31]) marks[d] = "holiday";
  return marks;
})();

/**
 * Titles shown in the day-click popup (qac_personnel/interactables/
 * CalendarEvents-Click). Dec 8 is transcribed verbatim from the frame; the other
 * three are the actual Philippine regular holidays that fall on those December
 * dates, so the popup reads correctly on every marked day rather than only the
 * one the frame happened to open.
 */
export const EVENT_TITLES: Record<number, string> = {
  8: "Feast of the Immaculate Conception",
  25: "Christmas Day",
  30: "Rizal Day",
  31: "Last Day of the Year",
};

/* ---------------------------------------------------------------------------
 * program_representative — assets/FIGMA/program_representative/01-Dashboard.png
 * ------------------------------------------------------------------------- */

export const PR_DASHBOARD_STATS: Stat[] = [
  { label: "COMPLETION RATE", value: "0%", note: "As of March 2026" },
  { label: "LEVEL II", value: "5", note: "As of March 2026" },
  { label: "LEVEL III", value: "6", note: "As of March 2026" },
  { label: "LEVEL IV", value: "12", note: "As of March 2026" },
  { label: "DEPARTMENT PROGRAMS", value: "23", note: "As of March 2026" },
];

export const PR_ONGOING_ACCREDITATION = [
  {
    id: "a1",
    // The frame shows this truncated with an ellipsis inside the cell.
    program: "Bachelor of Science in Information Technology",
    level: "II",
    accreditor: "Dela Cruz, Pedro Juan B.",
  },
];

/**
 * The frame's month is 31 days beginning on a Monday, with 2 circled as today
 * and 19 marked — January 2024 is the month that fits. Only the month name is
 * drawn, so the year is not visible.
 */
export const PR_CALENDAR_MONTH = new Date(2024, 0, 1);
export const PR_CALENDAR_TODAY = 2;
export const PR_CALENDAR_MARKS: Record<number, MeetingKind> = { 19: "psv" };

export const PR_DOC_STATUS: StatusBar[] = [
  { status: "approved", value: 33 },
  { status: "pending", value: 39 },
  { status: "disapproved", value: 13 },
];

export const PR_RECENT_UPLOADS: Upload[] = [
  {
    id: "u1",
    title: "BSIT Level III Re-Accredition Files",
    uploadedBy: "Juan Dela Cruz",
    when: "18 hours, 16 mins ago",
    status: "pending",
    kind: "link",
  },
  { id: "u2", title: "File Name", uploadedBy: "Name", when: "18 hours, 16 mins ago", status: "pending" },
  { id: "u3", title: "File Name", uploadedBy: "Name", when: "18 hours, 16 mins ago", status: "approved" },
  // Deliberately overflows the card — the frame clips its fourth row.
  { id: "u4", title: "File Name", uploadedBy: "Name", when: "18 hours, 16 mins ago", status: "pending" },
];

/** program_representative/02-Documents.png — the Templates tab. */
export const PR_TEMPLATE_SECTIONS = [
  {
    title: "Narrative Reports",
    documents: ["EXTENSION", "FACULTY DEVELOPMENT", "INSTRUCTIONS", "LINKAGES & CONSORTIA"],
  },
  {
    title: "Compliance Reports",
    documents: [
      "AREA 1", "AREA 2", "AREA 3", "AREA 4",
      "AREA 5", "AREA 6", "AREA 7", "AREA 8",
    ],
  },
];

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

/** 01-Dashboard.png (client revision, 2026-07) — four tiles, no trend arrow;
 *  same "As of <Month> <Year>" note style as PR_DASHBOARD_STATS. */
export const IA_DASHBOARD_STATS: Stat[] = [
  { label: "ASSIGNED", value: "0", note: "As of September 2026" },
  { label: "PENDING", value: "0", note: "As of September 2026" },
  { label: "COMPLETED", value: "0", note: "As of September 2026" },
  { label: "DUE THIS MONTH", value: "0", note: "As of September 2026" },
];

/** 01-Dashboard.png (revision) — "Assigned Program Evaluations" table. */
export const IA_ASSIGNED_EVALUATIONS = [
  {
    id: "ia1",
    campus: "Sta. Mesa, Manila",
    program: "Bachelor of Science in Information Technology",
    // The frame's Level cell reads "Level III", not just "III".
    level: "Level III",
    phase: "Monitoring",
    status: "Pending",
  },
];

/**
 * 01-Dashboard.png (revision) — "Evaluation Progress" table. The frame's own
 * header row reads "Program | Program | Level | Readiness" — the first
 * column's data is a campus, so this is almost certainly a client-side label
 * slip (meant "Campus"). Reproduced verbatim per house rule; flagged for the
 * owner rather than silently corrected.
 */
export const IA_EVALUATION_PROGRESS = [
  {
    id: "ia1",
    campus: "Sta. Mesa, Manila",
    program: "Bachelor of Science in Information Technology",
    level: "Level III",
    readiness: 15,
  },
];

/** 01-Dashboard.png (revision) — "Upcoming Schedule" table, paired with the
 *  same calendar the PR dashboard uses. */
export const IA_UPCOMING_SCHEDULE = [
  {
    id: "ia1",
    date: "September 28, 2026",
    title: "Re-Accreditation for Level IV",
    program: "Bachelor of Science in Information Technology",
    collegeCampus: "CCIS - Sta. Mesa, Manila",
  },
];

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

/** 03-DocumentEvaluation.png — two identical rows, the second one expanded. */
export const IA_EVALUATIONS = [
  {
    id: "ia-e1",
    campus: "Sta. Mesa, Manila",
    college: "CCIS",
    program: "Bachelor of Science in Information Technology",
    level: "IV",
    accreditor: "Dela Cruz, Pedro Juan B.",
    score: "Not yet released",
  },
  {
    id: "ia-e2",
    campus: "Sta. Mesa, Manila",
    college: "CCIS",
    program: "Bachelor of Science in Information Technology",
    level: "IV",
    accreditor: "Dela Cruz, Pedro Juan B.",
    score: "Not yet released",
  },
];

/** The evaluation track. Two steps done, so the first segment is yellow. */
export const IA_EVALUATION_STEPS: Step[] = [
  { label: "Assigned", done: true },
  { label: "File Uploaded", done: true },
  { label: "For Preliminary\nSurvey Visit" },
  { label: "Program Evaluated" },
  { label: "Return Score" },
];

/**
 * 03.1 / 03.2-DocumentEvaluation.png — the per-document review sheet.
 *
 * Both frames were exported at 1x (1440x809) rather than 2x, so unlike every
 * other screen this one is transcribed by eye and cannot be pixel-verified.
 * Flagged to the owner; re-export at 2x before trusting any diff of it.
 */
export const IA_NARRATIVE_DOCS = [
  "Extension",
  "Faculty Development",
  "Instructions",
  "Linkages & Consortia",
];

export const IA_COMPLIANCE_AREAS = Array.from({ length: 10 }, (_, i) => `Area ${i + 1}`);

export const IA_EVALUATION_WEBSITE = "https://www.wixsite.com/CCIS-BSIT";
export const IA_EVALUATION_WEBSITE_DONE = "https://www.figma.com/design/QAC-WARDS";

/* ── Submissions (program_representative/07 + 08 frames) ─────────────────── */

/**
 * Readiness Scores, one tile per accreditation level. `status` is the caption
 * under the percentage; `missing` is the document count beside it.
 */
export const PR_READINESS = [
  { level: "LEVEL I", percent: 23, status: "In Progress", missing: 18 },
  { level: "LEVEL II", percent: 0, status: "Not Started", missing: 25 },
  { level: "LEVEL III", percent: 0, status: "Not Started", missing: 25 },
  { level: "LEVEL IV", percent: 0, status: "Not Started", missing: 25 },
];

/**
 * The four accreditation levels. A level at 0% renders dimmed, which is exactly
 * how the frames distinguish "not started" rows — so there is no separate flag.
 *
 * The frames draw Level I's bar at ~28% and Phase 1's at 100% while both are
 * labelled 23%; the bar here is derived from `percent` instead of reproducing
 * that. Flagged to the owner rather than encoded.
 */
export const PR_ACCREDITATION_LEVELS = [
  { label: "Level I", percent: 23 },
  { label: "Level II", percent: 0 },
  { label: "Level III", percent: 0 },
  { label: "Level IV", percent: 0 },
];

/** Track under an expanded level. Line breaks are the prototype's own. */
export const PR_LEVEL_STEPS: Step[] = [
  { label: "Assigned", done: true },
  { label: "Phases Completed" },
  { label: "File Uploaded" },
  { label: "For Preliminary\nSurvey Visit" },
  { label: "Program\nEvaluated" },
];

/** 07-Submissions(Phases).png */
export const PR_PHASES = [
  { label: "Phase 1 (Planning)", percent: 23 },
  { label: "Phase 2 (Implementation)", percent: 45 },
  { label: "Phase 3 (Monitoring)", percent: 0 },
  { label: "Phase 4 (Evaluation)", percent: 0 },
];

/** 07-Submissions(PhasesReqs).png — label-only rows, no bar. */
export const PR_REQUIREMENTS = [
  "Narrative Report",
  "Best Practices",
  "Compliance Report",
  "Website",
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
