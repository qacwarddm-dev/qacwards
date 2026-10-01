export default function Empty({
  icon,
  title,
  children,
  compact,
}: {
  icon?: string;
  title?: React.ReactNode;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="empty" style={compact ? { padding: "24px 10px" } : undefined}>
      {icon && <div className="big">{icon}</div>}
      {title && (
        <>
          <b style={{ color: "var(--text)" }}>{title}</b>
          {children && <br />}
        </>
      )}
      {children}
    </div>
  );
}
