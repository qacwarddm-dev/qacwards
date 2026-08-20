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
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Reports</h1>
      <StatRow stats={stats} />

      <Card className="mt-[45px] px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <PanelHeader
          title="Report Generation"
          action={
            <Button variant="solid" icon={Plus} disabled>
              New
            </Button>
          }
        />
        {/* Decision 18 (O-7): honest "not available yet" rather than a dead
            button with no reason (09-ui-refactor §11 U-6 default: keep the
            generator visible with an explanation). */}
        <p className="t-sm mt-[10px] text-gray">
          A custom report builder isn&apos;t available yet. The KPIs above are
          drawn from live data in the meantime.
        </p>
        <div className="mt-[26px]">
          <EmptyState variant="empty" title="No reports generated yet." />
        </div>
      </Card>
    </div>
  );
}
