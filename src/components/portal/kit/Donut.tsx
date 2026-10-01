export type DonutPart = { label: string; value: number; color: string };

export default function Donut({ parts, size = 150, caption = "documents" }: { parts: DonutPart[]; size?: number; caption?: string }) {
  const tot = parts.reduce((s, p) => s + p.value, 0) || 1;
  const r = 56;
  const C = 2 * Math.PI * r;
  const segs = parts.map((p, i) => ({ p, len: (p.value / tot) * C, off: parts.slice(0, i).reduce((s, q) => s + (q.value / tot) * C, 0) }));
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" role="img" aria-label={`${tot} ${caption}`}>
      <circle cx="75" cy="75" r={r} fill="none" stroke="#f0f0f0" strokeWidth="20" />
      {segs.map(({ p, len, off }) => (
        <circle key={p.label} cx="75" cy="75" r={r} fill="none" stroke={p.color} strokeWidth="20" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 75 75)">
          <title>{`${p.label}: ${p.value}`}</title>
        </circle>
      ))}
      <text x="75" y="72" textAnchor="middle" fontSize="26" fontWeight="800" fill="#111">{String(parts.reduce((s, p) => s + p.value, 0))}</text>
      <text x="75" y="92" textAnchor="middle" fontSize="11" fill="#777">{caption}</text>
    </svg>
  );
}
