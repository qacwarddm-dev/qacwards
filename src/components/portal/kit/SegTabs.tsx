export type SegTab<K extends string> = { key: K; label: React.ReactNode; count?: number };

export default function SegTabs<K extends string>({
  tabs,
  value,
  onChange,
  flush,
}: {
  tabs: SegTab<K>[];
  value: K;
  onChange: (k: K) => void;
  flush?: boolean;
}) {
  return (
    <div className="segt" role="tablist" style={flush ? { margin: 0 } : undefined}>
      {tabs.map((t) => (
        <button key={t.key} type="button" role="tab" aria-selected={value === t.key} className={value === t.key ? "on" : ""} onClick={() => onChange(t.key)}>
          {t.label}
          {t.count ? <span className="sc">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
