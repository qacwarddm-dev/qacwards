/** White rounded surface used for every panel in the portal. */
export default function Card({
  className = "",
  radius = 20,
  children,
}: {
  className?: string;
  /** Prototype uses 8px for dashboard cards and ~20px for full-width panels. */
  radius?: 8 | 20;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-white shadow-card ${radius === 8 ? "rounded-lg" : "rounded-[20px]"} ${className}`}
    >
      {children}
    </div>
  );
}
