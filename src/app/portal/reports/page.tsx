import { Plus } from "lucide-react";
import { Button, Card, EmptyState, PanelHeader, StatRow } from "@/components/portal/kit";
import { getReportsStats } from "@/lib/dashboards";

/**
 * assets/FIGMA/qac_personnel/05-Reports.png
 *
 * Decision 18 (O-7): reports are KPI-derived for now, and there is no
 * generator or `reports` table behind this list yet — "New" stays disabled
 * rather than pretending to work, same treatment already used for the
 * evaluation sheet's un-backed "Evaluate"/"Return" buttons.
 */
export default async function ReportsPage() {
  const stats = await getReportsStats();

  return (
    <div className="px-[57px] pt-[45px] pb-[45px]">
      <StatRow stats={stats} />

      <Card className="mt-[45px] px-[44.5px] pb-[42px] pt-[47px]">
        <PanelHeader
          title="Report Generation"
          action={
            <Button variant="solid" icon={Plus} disabled>
              New
            </Button>
          }
        />
        <div className="mt-[26px]">
          <EmptyState message="No reports generated yet." />
        </div>
      </Card>
    </div>
  );
}
