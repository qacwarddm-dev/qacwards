import { ArrowUp } from "lucide-react";

export type Stat = {
  label: string;
  value: string;
  note: string;
  /** Shows the green up-arrow before the note (dashboard only). */
  trend?: boolean;
};

/**
 * Small metric tile. Used five-across on both the dashboard and Reports —
 * identical geometry, the only difference being the trend arrow.
 */
export default function StatCard({ label, value, note, trend }: Stat) {
  return (
    <article className="h-[104px] flex-1 rounded-lg bg-white px-[20px] pt-[16px] shadow-card">
      <h2 className="text-regular leading-none text-gray">{label}</h2>
      <p className="mt-[13px] text-heading font-bold leading-none">{value}</p>
      <p className="-ml-[4px] mt-[10px] flex h-[22px] items-center gap-[4px] text-regular leading-none">
        {trend && (
          <ArrowUp
            className="h-[22px] w-[22px] shrink-0 text-positive"
            strokeWidth={2}
            aria-hidden
          />
        )}
        <span className={trend ? "" : "ml-[4px]"}>{note}</span>
      </p>
    </article>
  );
}

/**
 * The row of tiles. 14px gutter across five tiles on the QAC Personnel and
 * Program Representative dashboards; the Internal Accreditor's three tiles are
 * measured 30 apart, so the gutter is a prop rather than a second component.
 */
export function StatRow({ stats, gap = 14 }: { stats: Stat[]; gap?: number }) {
  return (
    <div className="flex" style={{ gap }}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
