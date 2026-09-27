import { notFound, redirect } from "next/navigation";
import EvaluationSheetForm from "@/components/portal/screens/EvaluationSheetForm";
import {
  getAssignmentDetail,
  getAssignmentRequirements,
  getEvaluationSheet,
} from "@/lib/assignments";
import { getSignatories } from "@/lib/accreditor";
import { requireCurrentUser } from "@/lib/current-user";
import {
  HEADER_KEYS,
  isEvaluationOpen,
  levelLine,
  templateForLevel,
} from "@/lib/evaluation-sheet";

/** `/portal/evaluation/[id]/sheet` — the IA Evaluation Sheet (QAC FORM NO.005)
 *  both accreditors fill after Evaluate. Editable only on/after the site visit
 *  date while the assignment is `for_psv`; read-only once submitted. */
export default async function EvaluationSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireCurrentUser();
  const detail = await getAssignmentDetail(id);
  if (!detail) notFound();

  const isQac = user.role === "qac_personnel" || user.role === "qac_admin";
  const onTeam = detail.myResponse === "accepted";
  if (!onTeam && !isQac) notFound();

  const submitted = detail.status === "evaluated" || detail.status === "score_returned";
  const editable = onTeam && detail.status === "for_psv" && isEvaluationOpen(detail.siteVisitDate);
  if (!submitted && !editable) redirect(`/portal/evaluation/${id}`);

  const [sheet, requirements, signatories] = await Promise.all([
    getEvaluationSheet(id),
    getAssignmentRequirements(id),
    getSignatories(id),
  ]);

  const template = templateForLevel(detail.levelCode);
  const chosen = (requirements?.areas ?? []).filter((a) => a.chosen).map((a) => a.name);
  const defaults: Record<string, string> = {
    [HEADER_KEYS.visitDate]: detail.siteVisitDate ?? "",
    [HEADER_KEYS.areasEvaluated]:
      template.key === "l3"
        ? ["Instruction", "Extension and Community Involvement", ...chosen].join(", ")
        : template.key === "l4"
          ? "Areas 1 to 5"
          : "Areas I to X",
    ...(template.key === "l3" ? { area3Name: chosen[0] ?? "", area4Name: chosen[1] ?? "" } : {}),
  };
  const values = { ...defaults };
  for (const [k, v] of Object.entries(sheet.values)) if (v !== "") values[k] = v;
  const unsavedDefaults = Object.fromEntries(
    Object.entries(defaults).filter(([k, v]) => v && !sheet.values[k]),
  );

  return (
    <>
      <h1 className="sr-only">Evaluation Sheet</h1>
      <EvaluationSheetForm
        assignmentId={id}
        templateKey={template.key}
        program={detail.program}
        branch={detail.branch}
        levelLine={levelLine(detail.levelCode, detail.level)}
        initialValues={values}
        seedDefaults={editable ? unsavedDefaults : {}}
        readOnly={!editable}
        evaluatedAt={sheet.evaluatedAt}
        signatories={signatories.map((s) => ({
          id: s.id,
          name: s.name,
          signatureUrl: s.signatureUrl,
        }))}
      />
    </>
  );
}
