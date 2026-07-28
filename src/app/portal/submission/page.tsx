import ProgramRepSubmissions, {
  type SubmissionView,
} from "@/components/portal/screens/ProgramRepSubmissions";

/**
 * `/portal/submission` — the Program Representative's submission flow. Only
 * that role's sidebar links here, so there is no role switch yet; when a second
 * role gets Submissions frames this becomes the same thin `getCurrentUser()`
 * switch as `/portal/dashboard`.
 *
 * The five frames are query-param states, not five routes, because they share a
 * URL in the prototype's own breadcrumbs — see the screen for the mapping.
 */
const VIEWS: SubmissionView[] = ["levels", "phases", "requirements"];

export default async function SubmissionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = typeof params.view === "string" ? params.view : "levels";
  const view = VIEWS.includes(raw as SubmissionView)
    ? (raw as SubmissionView)
    : "levels";
  const level = Number(params.level);

  return (
    <ProgramRepSubmissions
      view={view}
      level={Number.isInteger(level) && level >= 1 && level <= 4 ? level : undefined}
      panel={params.panel === "levels" ? "levels" : undefined}
    />
  );
}
