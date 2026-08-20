/**
 * The accreditation areas each level is judged on, verbatim from
 * `docs/OtherContext.txt` "ACCREDITATION DOCUMENTS NEEDED".
 *
 * Rows are **per level**, not a deduplicated vocabulary. PSV, Level I and Level II
 * share one set of 10 Areas but are three separate submissions with three separate
 * readiness scores (BACKEND.md decision 9), so each carries its own 10 rows. That
 * keeps every level's denominator a plain `count(*)` and keeps "Research" under
 * Level IV distinct from "Research" under Level II, which are different rubrics
 * that merely share a word.
 *
 * `isOptional` marks Level III's five choose-from areas. The programme picks 2
 * (see `levels.requiredChoices`), recorded in `submission_choices`, so the Level III
 * denominator is 2 mandatory + 2 chosen = 4.
 *
 * **Count note.** BACKEND.md §2.1 and B1's acceptance both say 19 rows. This file
 * produces 42 — 10 each for PSV/I/II, 7 for Level III, 5 for Level IV. The plan's
 * own arithmetic table (§2.1: 18 + 10 = 28, 18 + 2 + 2 = 22, 18 + 5 = 23) requires
 * the per-level model, and no grouping of these areas totals 19: deduplicating
 * every repeated name across all five levels yields 18, and the three-levels-share-
 * one-set reading yields 22. The 19 does not reconcile; see BACKEND-PROGRESS.md.
 */
export type RequirementAreaSeed = {
  /** Joins `accreditation_levels.code`. */
  level: string;
  ordinal: number;
  name: string;
  /** True only for Level III's five choose-from areas. */
  isOptional: boolean;
};

/** The 10 Areas shared by PSV, Level I and Level II — same names, three levels. */
const TEN_AREAS = [
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

export const REQUIREMENT_AREAS: RequirementAreaSeed[] = [
  ...["PSV", "I", "II"].flatMap((level) =>
    TEN_AREAS.map((name, i) => ({ level, ordinal: i + 1, name, isOptional: false })),
  ),

  { level: "III", ordinal: 1, name: "Instruction", isOptional: false },
  { level: "III", ordinal: 2, name: "Extension", isOptional: false },
  { level: "III", ordinal: 3, name: "Faculty Development", isOptional: true },
  { level: "III", ordinal: 4, name: "Research", isOptional: true },
  { level: "III", ordinal: 5, name: "Licensure Exam", isOptional: true },
  { level: "III", ordinal: 6, name: "Consortia or Linkages", isOptional: true },
  { level: "III", ordinal: 7, name: "Library", isOptional: true },

  { level: "IV", ordinal: 1, name: "Research", isOptional: false },
  { level: "IV", ordinal: 2, name: "Teaching and Learning", isOptional: false },
  { level: "IV", ordinal: 3, name: "Extension", isOptional: false },
  { level: "IV", ordinal: 4, name: "Internationalization", isOptional: false },
  { level: "IV", ordinal: 5, name: "Planning Process", isOptional: false },
];
