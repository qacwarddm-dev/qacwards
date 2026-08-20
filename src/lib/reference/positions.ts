/**
 * The 13 positions a person can hold, from `docs/OtherContext.txt`
 * "PROGRAM POSITION" (4) and "QAC PERSONNELS POSITION" (9).
 *
 * `scope` is what the register form keys off: an Academic Program registrant
 * picks from the four, a QAC Personnel registrant from the nine.
 */
export type PositionSeed = {
  name: string;
  scope: "program" | "qac";
};

export const POSITIONS: PositionSeed[] = [
  { name: "Campus Director", scope: "program" },
  { name: "College Dean", scope: "program" },
  { name: "College Chairperson", scope: "program" },
  { name: "Faculty", scope: "program" },

  { name: "Director", scope: "qac" },
  {
    name: "Asst. Director for Program Quality Assurance and Curriculum Development",
    scope: "qac",
  },
  {
    name: "Asst. Director for Institutional and International Quality Assurance",
    scope: "qac",
  },
  { name: "Chief, Quality Assurance for Main Campus", scope: "qac" },
  {
    name: "Chief, Outcomes-Based Education and Continuous Quality Improvement",
    scope: "qac",
  },
  { name: "Chief, Institutional Accreditation and Sustainability", scope: "qac" },
  { name: "Chief, International Quality Assurance", scope: "qac" },
  { name: "Quality Assurance Coordinator", scope: "qac" },
  { name: "Administrative Staff", scope: "qac" },
];
