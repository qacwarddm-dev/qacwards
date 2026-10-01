import { redirect } from "next/navigation";
import IaSubmit from "@/components/portal/screens/ia/IaSubmit";
import { getSignatories, getSignatureUrl } from "@/lib/accreditor";
import { requireCurrentUser } from "@/lib/current-user";
import { getIaAssignments, iaStats } from "@/lib/ia-portal";
import { shortDate } from "@/lib/program-names";

export default async function SubmitEvaluationPage({ searchParams }: { searchParams: Promise<{ a?: string; step?: string }> }) {
  const user = await requireCurrentUser();
  const { a: id, step } = await searchParams;
  const all = await getIaAssignments(user.id);
  const a = all.find((x) => x.id === id && x.myResponse === "accepted");
  if (!a || !a.review) redirect("/portal/evaluation");
  const signed = a.report?.status === "submitted" || a.report?.status === "acknowledged";
  if (!signed && !iaStats(a).ready) redirect(`/portal/evaluation?a=${a.id}&st=req`);

  const [signatories, mySig] = await Promise.all([getSignatories(a.id), getSignatureUrl(user.id, user.signaturePath)]);
  const signers = signatories.map((s) => {
    const member = a.team.find((m) => m.id === s.id);
    const done = member?.report && (member.report.status === "submitted" || member.report.status === "acknowledged");
    return {
      id: s.id,
      name: s.name,
      signatureUrl: s.id === user.id ? mySig : s.signatureUrl,
      signedAt: done && member?.report?.signedAt ? shortDate(member.report.signedAt) : null,
      me: s.id === user.id,
    };
  });
  return <IaSubmit a={a} step={Number(step ?? 0) || 0} me={{ name: user.name, signatureUrl: mySig }} signers={signers} />;
}
