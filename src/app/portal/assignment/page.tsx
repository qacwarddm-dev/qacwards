import IaAssignments from "@/components/portal/screens/ia/IaAssignments";
import AssignForm from "@/components/portal/screens/qac/AssignForm";
import QacAccreditation from "@/components/portal/screens/qac/QacAccreditation";
import QacProgramDetail from "@/components/portal/screens/qac/QacProgramDetail";
import { requireCurrentUser } from "@/lib/current-user";
import { getIaAssignments } from "@/lib/ia-portal";
import { manilaDay } from "@/lib/program-names";
import { getAssignFormData, getQacOverview } from "@/lib/qac-portal";

export default async function AssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; stage?: string; new?: string; edit?: string; from?: string; p?: string; sub?: string }>;
}) {
  const user = await requireCurrentUser();
  const sp = await searchParams;

  if (user.role === "internal_accreditor") {
    return <IaAssignments assignments={await getIaAssignments(user.id)} />;
  }

  const today = manilaDay();
  const { programs } = await getQacOverview();
  const byId = (id?: string) => (id ? (programs.find((p) => p.id === id) ?? null) : null);

  if (sp.new) {
    const data = await getAssignFormData(user.id);
    return <AssignForm data={data} edit={byId(sp.edit)} from={byId(sp.from)} preset={byId(sp.p)} />;
  }

  const bySub = sp.sub ? programs.find((p) => p.submissionId === sp.sub) : null;
  const detail = byId(sp.id) ?? bySub ?? null;
  if (detail) {
    const stage = sp.stage === "pre" || sp.stage === "req" || sp.stage === "rep" ? sp.stage : undefined;
    return <QacProgramDetail p={detail} today={today} initialStage={stage} />;
  }

  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "Asia/Manila" });
  const invitations = user.actsAsAccreditor ? (await getIaAssignments(user.id)).filter((a) => a.myResponse === "pending") : [];
  return (
    <>
      <QacAccreditation programs={programs} today={today} monthLabel={month} />
      {invitations.length > 0 && <IaAssignments assignments={invitations} />}
    </>
  );
}
