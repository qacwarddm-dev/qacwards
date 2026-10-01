export default function FilterPills<K extends string>({
  items,
  value,
  onChange,
  flush,
}: {
  items: { key: K; label: React.ReactNode }[];
  value: K;
  onChange: (k: K) => void;
  flush?: boolean;
}) {
  return (
    <div className="pills" style={flush ? { margin: 0 } : undefined}>
      {items.map((i) => (
        <button key={i.key} type="button" className={`pt ${value === i.key ? "on" : ""}`} onClick={() => onChange(i.key)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
