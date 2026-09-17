"use client";

import { useMemo, useState } from "react";
import FeedbackChart from "@/components/portal/FeedbackChart";
import type { FeedbackEntry } from "@/lib/feedback";
import { Card, CardTitleBar, FilterBar, ProgressRow, RowList, StarRating } from "@/components/portal/kit";

/**
 * assets/new frames/EVENTS/Feedbacks.png (also exported, byte-identical,
 * as "Event Calendar.png" and "Event Schedule.png" — a client naming slip;
 * the sidebar is on Feedback in all three copies).
 */
export default function FeedbackOverview({
  entries,
  monthly,
}: {
  entries: FeedbackEntry[];
  monthly: { labels: string[]; series: number[] };
}) {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("All");
  const [level, setLevel] = useState("All");

  const campuses = useMemo(() => ["All", ...new Set(entries.map((e) => e.campus))], [entries]);
  const levels = useMemo(() => ["All", ...new Set(entries.map((e) => e.level))], [entries]);

  const filtered = entries.filter((e) => {
    if (search && !e.program.toLowerCase().includes(search.toLowerCase())) return false;
    if (campus !== "All" && e.campus !== campus) return false;
    if (level !== "All" && e.level !== level) return false;
    return true;
  });

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <h1 className="sr-only">Feedback</h1>

      <Card className="min-h-[320px] w-full">
        <CardTitleBar title="Overall Summary" />
        <div className="px-[25px] pb-[25px]">
          <FeedbackChart series={monthly.series} />
        </div>
      </Card>

      <Card className="mt-[26px] px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <div className="flex flex-wrap items-center justify-between gap-[16px]">
          <h2 className="text-heading font-semibold leading-none text-black">Feedbacks</h2>
          <FilterBar
            search={{ value: search, onChange: setSearch, label: "Search feedback" }}
            filters={[
              { label: "Campus", options: campuses, onSelect: setCampus },
              { label: "Level", options: levels, onSelect: setLevel },
            ]}
          />
        </div>

        <div className="mt-[20px]">
          <RowList>
            {filtered.map((f) => (
              <ProgressRow
                key={f.id}
                label={f.program}
                marker={false}
                meta={[f.campus, f.level]}
                right={
                  <span className="flex shrink-0 items-center gap-[10px]">
                    <StarRating value={f.rating} />
                    <span className="w-[36px] text-right font-semibold text-black">
                      {f.rating.toFixed(1)}
                    </span>
                  </span>
                }
              />
            ))}
          </RowList>
        </div>
      </Card>
    </div>
  );
}
