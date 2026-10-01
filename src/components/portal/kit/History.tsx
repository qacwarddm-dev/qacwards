export type HistoryEntry = { who: string; date: string; msg: string; tone: "rev" | "me" | "ok" };

/** The accreditor's compact timeline (IA review screens). */
export function HistoryList({ items }: { items: HistoryEntry[] }) {
  if (!items.length) return null;
  return (
    <div className="hist">
      <h6>HISTORY</h6>
      {items.map((h, i) => (
        <div key={i} className={h.tone === "me" ? "h-me" : h.tone === "ok" ? "h-ok" : ""}>
          <b>{h.who}</b>
          <small>{h.date}</small>
          <br />
          {h.msg}
        </div>
      ))}
    </div>
  );
}

/** The representative's conversation thread (Feedback, document view). */
export function Thread({ items }: { items: HistoryEntry[] }) {
  return (
    <div className="thread">
      {items.map((h, i) => (
        <div key={i} className={`msg${h.tone === "me" ? " me" : h.tone === "ok" ? " ok" : ""}`}>
          <b>{h.who}</b>
          <small>{h.date}</small>
          <p>{h.msg}</p>
        </div>
      ))}
    </div>
  );
}
