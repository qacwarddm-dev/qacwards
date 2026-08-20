/**
 * The five accreditation levels, from `docs/OtherContext.txt`
 * "ACCREDITATION LEVELS".
 *
 * `validityYears` — only Level IV expires (BACKEND.md decision 19, open item O-9
 * closed). The column exists on all five so filling in real terms later is a seed
 * change, not a migration.
 *
 * `requiredChoices` — Level III asks the programme to pick 2 of its 5 optional
 * areas ("With (2 choices by the program)"). Null everywhere else, because every
 * other level's areas are all mandatory.
 */
export type LevelSeed = {
  code: string;
  name: string;
  /** Sort order and, for §2.7 demotion, the level ladder. */
  ordinal: number;
  validityYears: number | null;
  requiredChoices: number | null;
};

export const LEVELS: LevelSeed[] = [
  { code: "PSV", name: "Preliminary Survey Visit", ordinal: 1, validityYears: null, requiredChoices: null },
  { code: "I", name: "Level I", ordinal: 2, validityYears: null, requiredChoices: null },
  { code: "II", name: "Level II", ordinal: 3, validityYears: null, requiredChoices: null },
  { code: "III", name: "Level III", ordinal: 4, validityYears: null, requiredChoices: 2 },
  { code: "IV", name: "Level IV", ordinal: 5, validityYears: 5, requiredChoices: null },
];
