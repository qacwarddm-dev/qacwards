import { redirect } from "next/navigation";
import RepAccreditation, { type RepView } from "@/components/portal/screens/rep/RepAccreditation";
import { requireCurrentUser } from "@/lib/current-user";
import { getGeneralTemplate, getRepPrograms, getVisitLabels } from "@/lib/rep-portal";

export default async function SubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; l?: string; st?: string; g?: string; hl?: string; program?: string; level?: string; sub?: string }>;
}) {
  const user = await requireCurrentUser();
  if (user.role !== "program_representative") redirect("/portal/dashboard");
  const sp = await searchParams;
  const [programs, tpl] = await Promise.all([getRepPrograms(), getGeneralTemplate()]);
  const visits = await getVisitLabels(programs);
  let p = sp.p ?? sp.program;
  let l = sp.l ?? sp.level;
  if (sp.sub) {
    const hit = programs.flatMap((x) => x.levels.map((lv) => ({ x, lv }))).find((o) => o.lv.submissionId === sp.sub);
    if (hit) {
      p = hit.x.id;
      l = hit.lv.levelId;
    }
  }
  if (p && !programs.some((x) => x.id === p)) p = programs.find((x) => p && x.id.startsWith(p.slice(-8)))?.id;
  const view: RepView = {
    p,
    l,
    st: sp.st === "pre" || sp.st === "req" ? sp.st : undefined,
    g: sp.g ? Number(sp.g) : undefined,
    hl: sp.hl,
  };
  return <RepAccreditation programs={programs} view={view} me={user.name} tpl={tpl} visits={visits} />;
}
