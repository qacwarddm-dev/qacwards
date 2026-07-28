/** White rounded surface used for every panel in the portal. */
export default function Card({
  className = "",
  radius = 20,
  variant = "shadow",
  children,
}: {
  className?: string;
  /** Prototype uses 8px for dashboard cards, 16px for the inner panels nested
   *  inside a page card, and ~20px for full-width panels. */
  radius?: 8 | 16 | 20;
  /** `shadow` is the elevated white panel; `outline` is the flat hairline-
   *  bordered box the create-assignment frame nests inside the page card. */
  variant?: "shadow" | "outline";
  children: React.ReactNode;
}) {
  const shape =
    radius === 8 ? "rounded-lg" : radius === 16 ? "rounded-[16px]" : "rounded-[20px]";
  const skin =
    variant === "outline"
      ? "bg-white border border-[color:var(--color-gray)]/25"
      : "bg-white shadow-card";
  return <div className={`${skin} ${shape} ${className}`}>{children}</div>;
}
