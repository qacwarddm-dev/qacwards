/**
 * Static option lists for the register form (assets/FIGMA/register).
 *
 * **Corrected against `docs/OtherContext.txt` in B0** (plans/BACKEND.md §6). The
 * earlier lists were transcribed from the prototype and had drifted: 15 campuses
 * instead of 23, a College of Law that does not exist in the authoritative list,
 * a missing Graduate School, and invented position titles. `OtherContext.txt` is
 * the authority; nothing here is invented.
 *
 * These lists are the *authoring source* only until B1, which generates the
 * reference tables from `src/lib/reference/*.ts` into `supabase/seed.sql`. At
 * that point this file re-exports from there instead of holding its own copy.
 */

/**
 * The four register frames in order (owner, 2026-07-26). Note this is not the
 * order the exports are named in: verify-webmail comes before createpassword,
 * so the webmail is proven to be the user's before a password exists for it.
 * Every step's forward button reads its target from here, so the chain is
 * defined once; `done` is where Profile's Next and Skip both land.
 */
export const REGISTER_STEPS = {
  account: "/register",
  verify: "/register/verify",
  password: "/register/password",
  profile: "/register/profile",
  done: "/login",
} as const;

/**
 * The three self-service roles. QAC Admin is provisioned, not self-registered,
 * so it is not offered here.
 *
 * `label` is what OtherContext.txt's SYSTEM ROLE OPTION calls it; `role` is the
 * database enum value. They differ for exactly one role — the owner's list says
 * "Academic Program" where every line of existing code says
 * `program_representative` (open item O-4). Keeping both in one record means the
 * UI can show the owner's word without a rename rippling through the codebase.
 */
export const SYSTEM_ROLES = [
  { label: "Academic Program", role: "program_representative" },
  { label: "Internal Accreditor", role: "internal_accreditor" },
  { label: "QAC Personnel", role: "qac_personnel" },
] as const;

export type SystemRoleLabel = (typeof SYSTEM_ROLES)[number]["label"];

/** The label the campus/college/position fields key off. */
export const ACADEMIC_PROGRAM_LABEL = "Academic Program";
export const QAC_PERSONNEL_LABEL = "QAC Personnel";

/** Program Representative registering under the main campus reveals the College /
 *  Department field; every other campus hides it (owner rule, 2026-07-25). */
export const MAIN_CAMPUS = "Sta. Mesa, Manila";

/** All 23 PUP campuses, verbatim from OtherContext.txt "PUP CAMPUSES". */
export const CAMPUSES = [
  "Alfonso",
  "Bansud",
  "Bataan",
  "Biñan",
  "Cabiao",
  "Calauan",
  "General Luna",
  "Lopez",
  "Maragondon",
  "Mulanay",
  "Parañaque",
  "Pulilan",
  "Quezon City",
  "Ragay",
  "Sablayan",
  "San Juan",
  "San Pedro",
  "Sta. Maria",
  MAIN_CAMPUS,
  "Sta. Rosa",
  "Sto. Tomas",
  "Taguig",
  "Unisan",
] as const;

/** The 14 main-campus colleges, verbatim from OtherContext.txt "COLLEGE
 *  DEPARTMENTS (Main Campus only)". No College of Law; Graduate School included. */
export const COLLEGES = [
  "College of Architecture, Design and the Built Environment",
  "College of Accountancy and Finance",
  "College of Arts and Letters",
  "College of Business Administration",
  "College of Computer and Information Science",
  "College of Communication",
  "College of Education",
  "College of Engineering",
  "College of Human Kinetics",
  "College of Political Science and Public Administration",
  "College of Science",
  "College of Social Sciences and Development",
  "College of Tourism, Hospitality and Transportation Management",
  "Graduate School",
] as const;

/** OtherContext.txt "PROGRAM POSITION" — shown to Academic Program registrants. */
export const PROGRAM_POSITIONS = [
  "Campus Director",
  "College Dean",
  "College Chairperson",
  "Faculty",
] as const;

/** OtherContext.txt "QAC PERSONNELS POSITION" — shown to QAC Personnel
 *  registrants. The register frame only ever drew the Academic Program state, so
 *  these nine had no field to live in until now. */
export const QAC_POSITIONS = [
  "Director",
  "Asst. Director for Program Quality Assurance and Curriculum Development",
  "Asst. Director for Institutional and International Quality Assurance",
  "Chief, Quality Assurance for Main Campus",
  "Chief, Outcomes-Based Education and Continuous Quality Improvement",
  "Chief, Institutional Accreditation and Sustainability",
  "Chief, International Quality Assurance",
  "Quality Assurance Coordinator",
  "Administrative Staff",
] as const;

/**
 * OtherContext.txt "AREA OF EXPERTISE" — the fixed list an Internal Accreditor
 * picks specializations from. Replaces the free-text field the prototype had;
 * `accreditor_expertise` needs foreign keys, not typed strings.
 */
export const EXPERTISE_AREAS = [
  "Accountancy",
  "Accounting and Finance",
  "Administration and Governance",
  "Anthropology",
  "Applied Mathematics",
  "Architecture",
  "Biology",
  "Broadcasting",
  "Business Administration",
  "Chemistry",
  "Civil Engineering",
  "Communication Research",
  "Computer Engineering",
  "Computer Science",
  "Criminology",
  "Creative Arts",
  "Cultural Studies",
  "Curriculum and Instruction",
  "Curriculum Development",
  "Cybersecurity",
  "Data Science",
  "Development Communication",
  "Economics",
  "Early Childhood Education",
  "Educational Management",
  "Electrical Engineering",
  "Electronics Engineering",
  "English Language Studies",
  "Entrepreneurship",
  "Environmental Science",
  "Event Management",
  "Extension and Community Development",
  "Faculty Development",
  "Filipinolohiya",
  "Fitness and Sports Coaching",
  "History",
  "Hospitality Management",
  "Higher Education Management",
  "Hotel and Restaurant Management",
  "Human Resource Management",
  "Industrial Engineering",
  "Information Systems",
  "Information Technology",
  "Journalism",
  "Laboratories Management",
  "Legal Studies",
  "Library and Information Science",
  "Library Services",
  "Manufacturing Engineering",
  "Marketing Management",
  "Mathematics",
  "Mechanical Engineering",
  "Media and Information Studies",
  "Mission, Goals, and Objectives",
  "Music",
  "Network Security",
  "Office Administration",
  "Outcomes-Based Education (OBE)",
  "Performing Arts",
  "Philosophy",
  "Physical Education",
  "Physical Facilities Management",
  "Physics",
  "Political Economy",
  "Political Science",
  "Psychology",
  "Public Administration",
  "Public Governance",
  "Quality Assurance in Higher Education",
  "Railway Engineering",
  "Records Management",
  "Research",
  "Research and Innovation",
  "Secondary Education",
  "Software Engineering",
  "Sociology",
  "Sports Science",
  "Statistics",
  "Student Services and Development",
  "Teacher Education",
  "Theater Arts",
  "Tourism Management",
] as const;
