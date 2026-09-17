import { notFound } from "next/navigation";
import ProgramRepServiceEvaluation from "@/components/portal/screens/ProgramRepServiceEvaluation";
import { createClient } from "@/lib/supabase/server";
import { getLevelReadiness, getMyPrograms } from "@/lib/submissions";

/**
 * assets/new frames/feedback submissions/image.png — "QAC Service
 * Evaluation". Reached from the Levels list's "Rate QAC's Service" button
 * once a level hits 100% (`ProgramRepSubmissions.tsx`'s `LevelsPanel`), not
 * its own nav item — `program_representative`'s rail has no Feedback entry
 * (portal-nav.ts), so this nests under `/portal/submission` instead, which
 * keeps the sidebar on "Submission" via the prefix match in
 * `PortalSidebar.tsx`.
 */
export default async function ServiceEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; level?: string }>;
}) {
  const { program: programSlugParam, level: levelId } = await searchParams;

  const programs = await getMyPrograms();
  const program = programs.find((p) => p.slug === programSlugParam);
  if (!program || !levelId) notFound();

  const levels = await getLevelReadiness(program.id, null);
  const level = levels.find((l) => l.levelId === levelId);
  if (!level || !level.submissionId) notFound();

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("submissions")
    .select("created_at, updated_at, programs(campuses(name))")
    .eq("id", level.submissionId)
    .maybeSingle();

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <ProgramRepServiceEvaluation
      program={program.label}
      campus={submission?.programs?.campuses?.name ?? "—"}
      level={level.label}
      // The frame draws a start-to-finish range; the closest real fields are
      // this submission's own open-to-latest-activity window, not an
      // invented pair of dates.
      dateRange={
        submission
          ? `${dateFmt(submission.created_at)} - ${dateFmt(submission.updated_at)}`
          : "—"
      }
    />
  );
}
