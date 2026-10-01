import { redirect } from "next/navigation";
import QacExtension from "@/components/portal/screens/qac/QacExtension";
import { requireCurrentUser } from "@/lib/current-user";
import { getQacOverview } from "@/lib/qac-portal";

export default async function ExtensionMonitoringPage({ searchParams }: { searchParams: Promise<{ p?: string; g?: string }> }) {
  const user = await requireCurrentUser();
  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const sp = await searchParams;
  const { programs } = await getQacOverview();
  const program = sp.p ? (programs.find((p) => p.id === sp.p && p.review) ?? null) : null;
  const g = sp.g !== undefined && /^\d+$/.test(sp.g) ? Number(sp.g) : null;
  return <QacExtension programs={programs} program={program} phase={g} meId={user.id} />;
}
