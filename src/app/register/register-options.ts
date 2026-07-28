/**
 * Static option lists for the register form (assets/FIGMA/register). These are UI
 * choices, not fake domain data — when auth lands (phase 3b) the campus/college/
 * position lists come from the database, but the three system roles stay fixed.
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

/** The dropdown offers the three self-service roles; QAC Admin is provisioned,
 *  not self-registered, so it is not here. The Figma showed "Academic Program" as
 *  a filled example — the owner's roles are these. */
export const SYSTEM_ROLES = [
  "QAC Personnel",
  "Internal Accreditor",
  "Program Representative",
] as const;

/** Program Representative registering under the main campus reveals the College /
 *  Department field; every other campus hides it (owner rule, 2026-07-25). */
export const MAIN_CAMPUS = "Sta. Mesa, Manila";

export const CAMPUSES = [
  MAIN_CAMPUS,
  "Taguig City",
  "Quezon City",
  "San Juan City",
  "Parañaque City",
  "Bataan",
  "Santo Tomas, Batangas",
  "Santa Maria, Bulacan",
  "Pulilan, Bulacan",
  "Cabiao, Nueva Ecija",
  "Lopez, Quezon",
  "Mulanay, Quezon",
  "Unisan, Quezon",
  "Ragay, Camarines Sur",
  "Sablayan, Occidental Mindoro",
] as const;

/** PUP main-campus colleges — only relevant when the campus is Sta. Mesa. */
export const COLLEGES = [
  "College of Accountancy and Finance",
  "College of Architecture, Design and the Built Environment",
  "College of Arts and Letters",
  "College of Business Administration",
  "College of Communication",
  "College of Computer and Information Sciences",
  "College of Education",
  "College of Engineering",
  "College of Human Kinetics",
  "College of Law",
  "College of Political Science and Public Administration",
  "College of Science",
  "College of Social Sciences and Development",
  "College of Tourism, Hospitality and Transportation Management",
] as const;

export const PUP_POSITIONS = [
  "Dean",
  "Associate Dean",
  "Department Chairperson",
  "Program Coordinator",
  "Faculty Member",
  "Program Representative",
] as const;
