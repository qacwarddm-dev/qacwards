export default function Bar({
  pct,
  color,
  height,
  className,
}: {
  pct: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const bg = color ?? (pct >= 100 ? "var(--green)" : undefined);
  return (
    <div className={className ? `bar ${className}` : "bar"} style={height ? { height } : undefined}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, ...(bg ? { background: bg } : {}) }} />
    </div>
  );
}

export function RBar({ pct, color, label }: { pct: number; color?: string; label?: React.ReactNode }) {
  return (
    <div className="rbar">
      <Bar pct={pct} color={color} />
      <b>{label ?? `${pct}%`}</b>
    </div>
  );
}
