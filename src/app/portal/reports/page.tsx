"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, EmptyState, FilterBar, PanelHeader } from "@/components/portal/kit";

/**
 * assets/new frames/EVENTS/Reports.png — 2026-09 client revision. The five
 * KPI tiles moved to the Dashboard (`getQacDashboard()` now reads
 * `getReportsStats()` directly, see src/lib/dashboards.ts), so this screen is
 * just the generation panel with its own search/year/type filter row.
 *
 * Decision 18 (O-7) still holds: there is no `reports` table and no
 * generator behind "New" yet, so the row stays a client-only filter shell
 * over an always-empty list rather than inventing report rows to match the
 * frame's single sample row.
 */
const YEARS = ["All", "2026", "2025", "2024"];
const TYPES = ["All", "Re-Accreditation", "Initial Accreditation", "Extension"];

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("All");
  const [type, setType] = useState("All");
  void search;
  void year;
  void type;

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Reports</h1>

      <Card className="px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <div className="flex flex-wrap items-center justify-between gap-[16px]">
          <PanelHeader title="Report Generation" />
        </div>

        <div className="mt-[20px]">
          <FilterBar
            search={{ value: search, onChange: setSearch, label: "Search reports" }}
            filters={[
              { label: "Year", options: YEARS, onSelect: setYear },
              { label: "Type", options: TYPES, onSelect: setType },
            ]}
            action={
              <Button variant="solid" icon={Plus} disabled>
                New
              </Button>
            }
          />
        </div>

        {/* Decision 18 (O-7): honest "not available yet" rather than a dead
            button with no reason (09-ui-refactor §11 U-6 default: keep the
            generator visible with an explanation). */}
        <p className="t-sm mt-[16px] text-gray">
          A custom report builder isn&apos;t available yet. Once reports exist,
          the filters above will narrow this list.
        </p>
        <div className="mt-[26px]">
          <EmptyState variant="empty" title="No reports generated yet." />
        </div>
      </Card>
    </div>
  );
}
