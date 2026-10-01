export default function SumRows({
  rows,
  flush,
  four,
}: {
  rows: [React.ReactNode, React.ReactNode][];
  flush?: boolean;
  four?: boolean;
}) {
  return (
    <div className={four ? "sumr s4" : "sumr"} style={flush ? { margin: 0 } : undefined}>
      {rows.map(([k, v], i) => (
        <div key={i}>
          <span>{k}</span>
          {typeof v === "string" || typeof v === "number" ? <b>{v}</b> : v}
        </div>
      ))}
    </div>
  );
}
