/**
 * Fake content for the static portal screens, transcribed from the client's
 * Figma frames. This whole file is the swap point when the backend lands —
 * nothing else needs to change (plans/03a-portal-ui-static.md).
 */
import type { DayMark, Stat, Step } from "./kit";

export const QAC_SEAL = "/assets/logos/qac.png";

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

export const PROFILE = {
  name: "Surname, Given Name M.I",
  position: "Position",
  office: "PUP Quality Assurance Center",
  webmail: "example@pup.edu.ph",
  createdOn: "Account Created on May 2026",
  positions: ["Position"],
};
