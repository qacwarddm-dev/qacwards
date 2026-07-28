import type { Band } from "./diff";

/**
 * Every screen that has an exported frame, with the diff budget it currently
 * meets. `budget` is a **regression guard, not a target** — it sits a little
 * above the measured value so a real drift fails the run while antialiasing
 * noise does not. When a screen is improved, tighten its budget.
 *
 * The antialiasing floor on this project is ~2.6-2.7%.
 */
export type Screen = {
  name: string;
  route: string;
  /** Repo-relative path to the Figma export. */
  frame: string;
  /** Dev-cookie user key; omit for screens outside /portal. */
  role?: string;
  budget: number;
  /**
   * Frames taller than the 810 viewport are scrolling frames: rendering at
   * full height stretches the sidebar (its rail is viewport-height while the
   * content scrolls), so only the content area is comparable.
   */
  contentFromX?: number;
  /** Explicit viewport; defaults to half the frame's pixel size. */
  viewport?: { width: number; height: number };
  /**
   * The auth screens' navbar is 59px in-frame and 80px live, so a whole-page
   * diff reads ~42% from a 21px shift of a photograph. Compare content-area to
   * content-area instead.
   */
  band?: Band;
};

const AUTH_BAND: Band = { frameTop: 118, renderTop: 160, height: 1498 };
const AUTH_VIEWPORT = { width: 1440, height: 829 };

export const SCREENS: Screen[] = [
  // --- auth ---------------------------------------------------------------
  {
    name: "login / role picker",
    route: "/login",
    frame: "assets/FIGMA/login/MainLogin.png",
    budget: 1.5,
    viewport: AUTH_VIEWPORT,
    band: AUTH_BAND,
  },
  {
    name: "login / credentials form",
    route: "/login?as=qac_personnel",
    frame: "assets/FIGMA/login/LoginForm.png",
    budget: 1.4,
    viewport: AUTH_VIEWPORT,
    band: AUTH_BAND,
  },

  // --- qac_personnel ------------------------------------------------------
  { name: "qp / dashboard", route: "/portal/dashboard", frame: "assets/FIGMA/qac_personnel/01-Dashboard.png", role: "qac_personnel", budget: 3.0 },
  { name: "qp / documents", route: "/portal/documents", frame: "assets/FIGMA/qac_personnel/02-Documents.png", role: "qac_personnel", budget: 4.5 },
  { name: "qp / campuses", route: "/portal/documents/campuses", frame: "assets/FIGMA/qac_personnel/02.5-Documents-Campuses.png", role: "qac_personnel", budget: 6.3 },
  { name: "qp / main campus", route: "/portal/documents/main-campus", frame: "assets/FIGMA/qac_personnel/02.6-Document-MainCampus.png", role: "qac_personnel", budget: 10.2 },
  { name: "qp / assignment", route: "/portal/assignment", frame: "assets/FIGMA/qac_personnel/03-Accreditation Assignment.png", role: "qac_personnel", budget: 4.8 },
  { name: "qp / events", route: "/portal/events", frame: "assets/FIGMA/qac_personnel/04-Events.png", role: "qac_personnel", budget: 5.0 },
  { name: "qp / reports", route: "/portal/reports", frame: "assets/FIGMA/qac_personnel/05-Reports.png", role: "qac_personnel", budget: 3.2 },
  { name: "qp / profile", route: "/portal/profile", frame: "assets/FIGMA/qac_personnel/06-Profile.png", role: "qac_personnel", budget: 5.0 },

  // --- program_representative ---------------------------------------------
  { name: "pr / dashboard", route: "/portal/dashboard", frame: "assets/FIGMA/program_representative/01-Dashboard.png", role: "program_representative", budget: 3.6, contentFromX: 250 },
  { name: "pr / documents · templates", route: "/portal/documents", frame: "assets/FIGMA/program_representative/02-Documents.png", role: "program_representative", budget: 5.7 },
  { name: "pr / documents · NDA gate", route: "/portal/documents?tab=common", frame: "assets/FIGMA/program_representative/03-CommonsDocument(NDA).png", role: "program_representative", budget: 2.9 },
  { name: "pr / documents · common files", route: "/portal/documents?tab=common&nda=1", frame: "assets/FIGMA/program_representative/04-CommonDocuments(NDAFiles).png", role: "program_representative", budget: 6.5 },
  { name: "pr / documents · reports", route: "/portal/documents?tab=reports", frame: "assets/FIGMA/program_representative/05-AccreditationFiles.png", role: "program_representative", budget: 3.9 },
  { name: "pr / documents · in folder", route: "/portal/documents?tab=reports&folder=x", frame: "assets/FIGMA/program_representative/06-AccreditationFiles&Folders.png", role: "program_representative", budget: 4.3 },
  { name: "pr / profile", route: "/portal/profile", frame: "assets/FIGMA/program_representative/09-Profile.png", role: "program_representative", budget: 5.0 },
  { name: "pr / events", route: "/portal/events", frame: "assets/FIGMA/program_representative/010-Events.png", role: "program_representative", budget: 4.8 },

  // --- not built yet ------------------------------------------------------
  // program_representative: 07-Submissions{,(Phases),(PhasesReqs)},
  //   08-Submissions{(Levels),(LevelsAcred}  -> /portal/submission
  // internal_accreditor: all 7 (03.1 and 03.2 are 1x exports and cannot be
  //   measured until re-exported at 2x)
];
