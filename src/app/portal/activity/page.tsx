import { redirect } from "next/navigation";
import SystemActivity from "@/components/portal/screens/SystemActivity";
import { getActivityEntries } from "@/lib/activity";
import { requireCurrentUser } from "@/lib/current-user";
import { manilaDay } from "@/lib/program-names";

export default async function ActivityPage() {
  const user = await requireCurrentUser();
  if (user.role !== "qac_admin") redirect("/portal/my-activity");
  const entries = await getActivityEntries({ role: user.role, want: 400, maxBatches: 20 });
  return <SystemActivity entries={entries} today={manilaDay()} />;
}
