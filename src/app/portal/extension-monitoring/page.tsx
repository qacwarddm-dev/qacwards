import { Card, PanelHeader, ProgressRow, RowList } from "@/components/portal/kit";
import { getExtensionPrograms } from "@/lib/extension-monitoring";

/**
 * assets/new frames/QAC/Externsion Monitoring/0.png — the Programs landing
 * for Extension Monitoring, same row shape as the Submission screens'
 * Levels list (`ProgressRow` in a `RowList`).
 */
export default async function ExtensionMonitoringPage() {
  const programs = await getExtensionPrograms();

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Extension Monitoring</h1>

      <Card className="px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <PanelHeader title="Programs" />
        <div className="mt-[20px]">
          <RowList>
            {programs.map((p) => (
              <ProgressRow
                key={p.id}
                label={p.program}
                meta={[p.campus, p.level]}
                percent={p.percent}
                marker={false}
                href={`/portal/extension-monitoring/${p.id}`}
              />
            ))}
          </RowList>
        </div>
      </Card>
    </div>
  );
}
