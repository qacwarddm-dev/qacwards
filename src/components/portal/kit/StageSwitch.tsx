import { Fragment } from "react";

export type Stage<K extends string> = {
  key: K;
  title: string;
  sub: React.ReactNode;
  pct: number;
  done?: boolean;
  disabled?: boolean;
};

export default function StageSwitch<K extends string>({
  stages,
  value,
  onChange,
  arrows,
}: {
  stages: Stage<K>[];
  value: K;
  onChange: (k: K) => void;
  arrows?: boolean;
}) {
  return (
    <div className="stg">
      {stages.map((s, i) => (
        <Fragment key={s.key}>
          {arrows && i > 0 && <span className="stga">›</span>}
          <button type="button" className={`${value === s.key ? "on" : ""} ${s.disabled ? "dis" : ""}`} onClick={() => onChange(s.key)}>
            <i>{s.done ? "✓" : i + 1}</i>
            <span>
              <b>{s.title}</b>
              <small>{s.sub}</small>
            </span>
            <em>{s.pct}%</em>
          </button>
        </Fragment>
      ))}
    </div>
  );
}
