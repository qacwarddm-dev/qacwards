import StatusPill from "./StatusPill";
import type { StatusKey } from "./status";

/**
 * Ring gauge for the Extension Monitoring phase cards — four of these sit
 * side by side, each showing a phase's document-approval percentage.
 * Plain SVG stroke-dasharray, same "no chart dependency" convention as
 * `CopcChart`.
 */
export default function RadialProgress({
  label,
  percent,
  status,
  caption,
  size = 128,
}: {
  label: string;
  percent: number;
  status: StatusKey;
  caption: string;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-1 flex-col items-center rounded-[16px] border border-[color:var(--color-gray)]/20 px-[16px] py-[20px]">
      <h3 className="text-small font-semibold uppercase tracking-wide text-gray">{label}</h3>

      <div className="relative mt-[16px]" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-gray)"
            strokeOpacity={0.2}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-yellow)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (filled / 100) * c}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-heading font-bold text-black">
          {filled}%
        </span>
      </div>

      <div className="mt-[14px]">
        <StatusPill status={status} size="sm" />
      </div>
      <p className="mt-[8px] text-small leading-none text-gray">{caption}</p>
    </div>
  );
}
