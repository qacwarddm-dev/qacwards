export default function Ring({
  pct,
  size = 104,
  color,
  track = "#e8e8e8",
  width = 9,
}: {
  pct: number;
  size?: number;
  color?: string;
  track?: string;
  width?: number;
}) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const col = color ?? (pct === 100 ? "#22a33a" : "#eab308");
  return (
    <svg width={size} height={size} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={width} fill="none" />
      {pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={col}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      )}
    </svg>
  );
}
