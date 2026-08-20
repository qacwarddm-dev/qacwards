/**
 * Loading placeholder that matches the real layout it stands in for (09b §5:
 * opacity pulse, 1.4s, killed under prefers-reduced-motion by the global rule
 * in globals.css). Compose several for a page's `loading.tsx`.
 */
export default function Skeleton({
  w = "100%",
  h = 16,
  radius = "md",
  lines,
  className = "",
}: {
  w?: number | string;
  h?: number | string;
  radius?: "sm" | "md" | "lg" | "full";
  /** Renders `lines` stacked bars instead of one block — the last line is 60% width. */
  lines?: number;
  className?: string;
}) {
  const rad = `var(--radius-${radius})`;
  const box = (width: number | string, key?: number) => (
    <span
      key={key}
      style={{ width, height: h, borderRadius: rad }}
      className={`block animate-pulse bg-[color:var(--color-gray)]/15 ${className}`}
    />
  );

  if (!lines) return box(w);

  return (
    <span className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => box(i === lines - 1 ? "60%" : w, i))}
    </span>
  );
}
