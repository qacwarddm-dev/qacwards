import ProgramRepSubmissions, {
  type SubmissionView,
} from "@/components/portal/screens/ProgramRepSubmissions";
import {
  getLevelReadiness,
  getMyPrograms,
  getOpenCycle,
  getPhaseProgress,
  getRequirementAreas,
} from "@/lib/submissions";

/**
 * `/portal/submission` — the Program Representative's submission flow. Only that
 * role's sidebar links here, so there is no role switch yet.
 *
 * Every state past the Programs picker is query-param, not its own route — see
 * the screen for the full frame-to-URL mapping.
 *
 * B4 made this the fetching half: the screen stayed presentational and now takes
 * a `SubmissionData` prop where it used to import `PR_*` constants. Which
 * programmes appear is decided by RLS (`my_program_ids()`), not by a filter here,
 * so a representative asking for another campus's programme gets an empty list
 * rather than a rejection.
 */
const VIEWS: SubmissionView[] = ["levels", "phases", "requirements"];

export default async function SubmissionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.view === "string" ? params.view : "levels";
  const view = VIEWS.includes(raw as SubmissionView) ? (raw as SubmissionView) : "levels";

  const [programs, cycle] = await Promise.all([getMyPrograms(), getOpenCycle()]);

  const program =
    typeof params.program === "string" && programs.some((p) => p.slug === params.program)
      ? params.program
      : undefined;
  const programId = programs.find((p) => p.slug === program)?.id ?? null;

  const phase = Number(params.phase);
  const levels = programId ? await getLevelReadiness(programId, cycle?.id ?? null) : [];

  // The level being worked on comes from the URL; falling back to the first one
  // keeps a bookmarked ?view=phases link working instead of rendering nothing.
  const levelId =
    typeof params.level === "string" && levels.some((l) => l.levelId === params.level)
      ? params.level
      : (levels[0]?.levelId ?? null);

  const current = levels.find((l) => l.levelId === levelId) ?? null;

  const [phases, areas] = await Promise.all([
    programId ? getPhaseProgress(current?.submissionId ?? null) : Promise.resolve([]),
    levelId
      ? getRequirementAreas(levelId, current?.submissionId ?? null)
      : Promise.resolve([]),
  ]);

  return (
    <ProgramRepSubmissions
      program={program}
      programId={programId ?? undefined}
      view={view}
      phase={Number.isInteger(phase) && phase >= 1 && phase <= 4 ? phase : undefined}
      modal={params.modal === "add" ? "add" : undefined}
      levelId={levelId ?? undefined}
      areaId={typeof params.area === "string" ? params.area : undefined}
      data={{
        programs: programs.map((p) => ({ slug: p.slug, label: p.label })),
        levels: levels.map((l) => ({
          levelId: l.levelId,
          label: l.label,
          code: l.code,
          percent: l.percent,
          requiredCount: l.requiredCount,
          uploadedCount: l.uploadedCount,
          submissionId: l.submissionId,
        })),
        phases,
        areas,
        openCycleName: cycle?.name ?? null,
      }}
    />
  );
}
