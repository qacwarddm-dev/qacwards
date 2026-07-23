import { Plus } from "lucide-react";
import { REPORT_STATS, REPORTS } from "@/components/portal/data";
import {
  Button,
  Card,
  type Column,
  DataTable,
  PanelHeader,
  StatRow,
} from "@/components/portal/kit";

/** assets/FIGMA/qac_personnel/05-Reports.png */
const COLUMNS: Column[] = [
  { key: "type", header: "Type of Report", width: "flex-1" },
  { key: "modifiedBy", header: "Modified by", width: "w-[420px]" },
  { key: "generated", header: "Date Generated", width: "w-[330px]" },
];

export default function ReportsPage() {
  const rows = REPORTS.map((r) => ({
    id: r.id,
    cells: {
      type: <span className="text-gray">{r.type}</span>,
      modifiedBy: <span className="text-gray">{r.modifiedBy}</span>,
      generated: <span className="text-gray">{r.generated}</span>,
    },
  }));

  return (
    <div className="px-[57px] pt-[45px] pb-[45px]">
      <StatRow stats={REPORT_STATS} />

      <Card className="mt-[45px] px-[44.5px] pb-[42px] pt-[47px]">
        <PanelHeader
          title="Report Generation"
          action={
            <Button variant="solid" icon={Plus}>
              New
            </Button>
          }
        />
        <div className="mt-[26px]">
          <DataTable columns={COLUMNS} rows={rows} />
        </div>
      </Card>
    </div>
  );
}
