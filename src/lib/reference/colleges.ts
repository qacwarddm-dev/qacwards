/**
 * The 14 main-campus colleges, verbatim from `docs/OtherContext.txt`
 * "COLLEGE DEPARTMENTS (Main Campus only)".
 *
 * There is no College of Law — the prototype's list had one and it was wrong
 * (BACKEND.md §6). Graduate School is a college here, but note that graduate
 * degrees are not all filed under it (see `programs.ts`).
 *
 * `code` is the seed's natural key, and it is the acronym OtherContext.txt itself
 * prints in parentheses.
 */
export type CollegeSeed = {
  code: string;
  name: string;
};

export const COLLEGES: CollegeSeed[] = [
  { code: "CADBE", name: "College of Architecture, Design and the Built Environment" },
  { code: "CAF", name: "College of Accountancy and Finance" },
  { code: "CAL", name: "College of Arts and Letters" },
  { code: "CBA", name: "College of Business Administration" },
  { code: "CCIS", name: "College of Computer and Information Science" },
  { code: "COC", name: "College of Communication" },
  { code: "COED", name: "College of Education" },
  { code: "CE", name: "College of Engineering" },
  { code: "CHK", name: "College of Human Kinetics" },
  { code: "CPSPA", name: "College of Political Science and Public Administration" },
  { code: "CS", name: "College of Science" },
  { code: "CSSD", name: "College of Social Sciences and Development" },
  { code: "CTHTM", name: "College of Tourism, Hospitality and Transportation Management" },
  { code: "GS", name: "Graduate School" },
];
