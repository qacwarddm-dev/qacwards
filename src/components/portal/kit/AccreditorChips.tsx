import type { QacMember } from "@/lib/qac-model";

/** Two-accreditor team: initials chips, ⏳ for not yet accepted, and the gap called out. */
export default function AccreditorChips({ team }: { team: QacMember[] }) {
  const active = team.filter((m) => m.response !== "rejected");
  if (!active.length) return <span className="iach miss">＋ 2 needed</span>;
  return (
    <>
      {active.map((a) => (
        <span key={a.id} className={`iach${a.response === "pending" ? " wait" : ""}`} title={a.response === "pending" ? "Hasn’t accepted yet" : a.acting ? `Acting IA · ${a.acting}` : "Accepted"}>
          <i>{a.surname.slice(0, 2).toUpperCase()}</i>
          {a.surname}
          {a.response === "pending" ? " ⏳" : ""}
        </span>
      ))}
      {active.length < 2 && <span className="iach miss">＋ 1 needed</span>}
    </>
  );
}
