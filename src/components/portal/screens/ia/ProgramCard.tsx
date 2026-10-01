import Btn from "../../kit/Btn";
import Pill from "../../kit/Pill";
import { MIN_DOCS_PCT, iaStats, statusLabel, type IaAssignment } from "@/lib/ia-model";

export default function ProgramCard({ a }: { a: IaAssignment }) {
  const s = iaStats(a);
  const ok = s.docsPct >= MIN_DOCS_PCT;
  const st = statusLabel(a);
  const signed = a.report && (a.report.status === "submitted" || a.report.status === "acknowledged");
  return (
    <div className={`pc2${ok ? "" : " dim"}`}>
      <div className="pn">
        <b>{a.mid}</b>
        <small className="pcamp">
          📍 {a.campus} campus · {a.college}
        </small>
        <small>
          {a.levelName} · <Pill tone={signed ? "pg" : "py"}>{signed ? "Submitted" : st.t}</Pill> · Visit {a.visitLabel}
          {s.pending > 0 && !signed && (
            <>
              {" "}
              · <b style={{ color: "#8a6d00" }}>{s.pending} to review</b>
            </>
          )}
        </small>
      </div>
      <div className="dual">
        <div>
          <span>Documents</span>
          <div className="bar">
            <i style={{ width: `${s.docsPct}%`, background: "var(--gold)" }} />
          </div>
          <span>{s.docsPct}%</span>
        </div>
        <div>
          <span>Evaluated</span>
          <div className="bar">
            <i style={{ width: `${s.evalPct}%`, background: s.evalPct === 100 ? "var(--green)" : "var(--maroon)" }} />
          </div>
          <span>{s.evalPct}%</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        {signed ? (
          <Btn variant="o" href={`/portal/evaluation/submit?a=${a.id}&step=3`}>
            View report
          </Btn>
        ) : ok ? (
          <Btn href={`/portal/evaluation?a=${a.id}`}>{s.started ? "Continue" : "Evaluate"} ›</Btn>
        ) : (
          <Btn disabled>Evaluate ›</Btn>
        )}
        {!ok && <div className="gate">Waiting for documents (min {MIN_DOCS_PCT}%)</div>}
      </div>
    </div>
  );
}
