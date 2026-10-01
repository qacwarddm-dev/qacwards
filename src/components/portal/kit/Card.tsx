export default function Card({
  children,
  variant,
  id,
  style,
}: {
  children: React.ReactNode;
  variant?: "pac" | "fixh" | "fixh2" | "phead" | "fpanel" | "row";
  id?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div id={id} className={variant ? `card ${variant}` : "card"} style={style}>
      {children}
    </div>
  );
}

export function CardHead({
  title,
  sub,
  right,
  top,
  level = 2,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  top?: React.ReactNode;
  level?: 2 | 3;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="ch">
      <div>
        {top}
        {title !== undefined && <H style={top ? { marginTop: 6 } : undefined}>{title}</H>}
        {sub !== undefined && <div className="sub">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
