export default function Result({
  tone,
  icon,
  title,
  children,
}: {
  tone: "ok" | "bad" | "neutral" | "danger";
  icon?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  const style: React.CSSProperties =
    tone === "ok"
      ? { background: "var(--green-soft)", color: "var(--green)" }
      : tone === "bad"
        ? { background: "var(--red-soft)", color: "var(--red)" }
        : tone === "danger"
          ? { background: "#fdecec" }
          : { background: "#f3f3f3" };
  return (
    <div className="result">
      <div className="ck" style={style}>
        {icon ?? (tone === "ok" ? "✓" : tone === "bad" ? "✕" : "•")}
      </div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
