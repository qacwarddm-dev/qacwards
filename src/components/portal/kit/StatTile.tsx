import Link from "next/link";

export type StatTileProps = {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: string;
  iconBg?: string;
  valueColor?: string;
  small?: boolean;
  href?: string;
  onClick?: () => void;
  flat?: boolean;
};

export default function StatTile({ label, value, sub, icon, iconBg, valueColor, small, href, onClick, flat }: StatTileProps) {
  const style: React.CSSProperties | undefined = flat
    ? { cursor: "default", boxShadow: "none", border: "1px solid var(--line)" }
    : !href && !onClick
      ? { cursor: "default" }
      : undefined;
  const bStyle: React.CSSProperties = {
    ...(valueColor ? { color: valueColor } : {}),
    ...(small ? { fontSize: 17, margin: "8px 0 6px", paddingRight: 30 } : {}),
  };
  const inner = (
    <>
      {icon && (
        <div className="ico" style={{ background: iconBg }}>
          {icon}
        </div>
      )}
      <span>{label}</span>
      <b style={bStyle}>{value}</b>
      {sub !== undefined && <small>{sub}</small>}
    </>
  );
  if (href)
    return (
      <Link className="st" href={href} style={{ display: "block", ...style }}>
        {inner}
      </Link>
    );
  return (
    <div className="st" style={style} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      {inner}
    </div>
  );
}

export function StatGrid({ children, cols }: { children: React.ReactNode; cols?: 3 | 4 | 5 }) {
  const cls = cols === 5 ? "stats s5" : "stats";
  return (
    <div className={cls} style={cols === 3 ? { gridTemplateColumns: "repeat(3,1fr)" } : undefined}>
      {children}
    </div>
  );
}
