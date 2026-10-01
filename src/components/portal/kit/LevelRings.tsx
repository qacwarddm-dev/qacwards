import Ring from "./Ring";
import { pillClass, type PillTone } from "./Pill";

export type RingItem = {
  key: string;
  short: string;
  pct: number;
  center: React.ReactNode;
  pill: { tone: PillTone; text: string };
  sub: string;
  locked?: boolean;
  selected?: boolean;
  color?: string;
  title?: string;
  onClick?: () => void;
};

export default function LevelRings({ items, four }: { items: RingItem[]; four?: boolean }) {
  return (
    <div className={four ? "rings r4" : "rings"}>
      {items.map((r) => (
        <div
          key={r.key}
          className={`rc${r.locked ? " locked" : ""}${r.selected ? " sel" : ""}`}
          onClick={r.onClick}
          title={r.title}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && r.onClick?.()}
        >
          <h5>{r.short}</h5>
          <div className="qring">
            <Ring pct={r.pct} color={r.color} />
            <b>{r.center}</b>
          </div>
          <span className={pillClass(r.pill.tone)}>{r.pill.text}</span>
          <small>{r.sub}</small>
        </div>
      ))}
    </div>
  );
}
