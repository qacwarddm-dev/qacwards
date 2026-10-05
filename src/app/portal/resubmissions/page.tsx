import { redirect } from "next/navigation";
import IaResubmissions from "@/components/portal/screens/ia/IaResubmissions";
import { requireCurrentUser } from "@/lib/current-user";
import { getIaAssignments } from "@/lib/ia-portal";
import { getResubmissions } from "@/lib/reviews";

export default async function ResubmissionsPage() {
  const user = await requireCurrentUser();
  if (!user.actsAsAccreditor) redirect("/portal/dashboard");
  const [items, assignments] = await Promise.all([getResubmissions(user.id), getIaAssignments(user.id)]);
  const rows = items.filter(({ slot }) => slot.kind === "area").map(({ review, slot, remark }) => {
    const a = assignments.find((x) => x.submissionId === review.submissionId);
    const where = `st=req&ar=${slot.refId}`;
    return {
      key: `${review.submissionId}:${slot.key}`,
      file: slot.file ?? slot.name,
      version: slot.version,
      context: `${review.program.short} · ${review.levelName} · ${slot.name}`,
      remark,
      date: slot.date ?? "—",
      href: a ? `/portal/evaluation?a=${a.id}&${where}` : "/portal/evaluation",
    };
  });
  return <IaResubmissions rows={rows} />;
}
