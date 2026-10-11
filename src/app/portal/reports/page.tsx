import { redirect } from "next/navigation";
import QacReports from "@/components/portal/screens/qac/QacReports";
import { requireCurrentUser } from "@/lib/current-user";
import { getQacOverview } from "@/lib/qac-portal";
import { getReportsData } from "@/lib/reports";
import { isReportType } from "@/lib/report-model";
import { manilaDay } from "@/lib/program-names";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const user = await requireCurrentUser();
  if (user.role !== "qac_personnel" && user.role !== "qac_admin") redirect("/portal/dashboard");
  const sp = await searchParams;
  const [{ programs }, { saved, catalog, colleges, cert }] = await Promise.all([getQacOverview(), getReportsData()]);
  return (
    <QacReports
      programs={programs}
      catalog={catalog}
      saved={saved}
      colleges={colleges}
      cert={cert}
      today={manilaDay()}
      me={user.name}
      initialNew={isReportType(sp.new) ? sp.new : null}
    />
  );
}
