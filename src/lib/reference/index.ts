/**
 * Reference data — the one place a human edits the fixed lists this system runs on.
 *
 * `pnpm gen:seed` reads these modules and writes `supabase/seed.sql`, which
 * `supabase db reset` loads into real tables with real foreign keys. Never edit
 * `supabase/seed.sql` by hand; it is generated and `pnpm check:seed` fails CI when
 * it drifts from these files.
 *
 * Everything here except `repository-folders.ts` comes from `docs/OtherContext.txt`,
 * which is the sole authority for reference data. Nothing is invented: where the
 * source is silent, the item is left out and flagged as an open question rather
 * than guessed into existence.
 */
export { CAMPUSES, MAIN_CAMPUS_SLUG, type CampusSeed } from "./campuses";
export { COLLEGES, type CollegeSeed } from "./colleges";
export { PROGRAMS, type ProgramSeed } from "./programs";
export { POSITIONS, type PositionSeed } from "./positions";
export { EXPERTISE_AREAS } from "./expertise-areas";
export { LEVELS, type LevelSeed } from "./levels";
export { PHASES, PHASE_DOCUMENTS, type PhaseSeed, type PhaseDocumentSeed } from "./phases";
export { REQUIREMENT_AREAS, type RequirementAreaSeed } from "./requirement-areas";
export { REPOSITORY_FOLDERS, type RepositoryFolderSeed } from "./repository-folders";
