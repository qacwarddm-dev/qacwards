import AccreditationProgress, { type ProgressChip, type ProgressStageView } from "./AccreditationProgress";
import Pill, { type PillTone } from "./Pill";
import { computeProgress, PROGRESS_STAGES, type ProgressInput, type ReportState } from "@/lib/progress-model";
import type { DocState } from "@/lib/review-model";

type Perspective = "staff" | "rep";

const AREA_PILL: Record<DocState, [string, PillTone]> = {
  approved: ["Accepted", "ok"],
  returned: ["Returned · revise", "ret"],
  pending: ["With accreditor", "pend"],
  draft: ["Draft", "miss"],
  missing: ["Not uploaded", "miss"],
};

const REPORT_PILL: Record<ReportState, [string, PillTone]> = {
  ack: ["Acknowledged by QAC", "ok"],
  submitted: ["Submitted · for QAC review", "blue"],
  returned: ["Returned to accreditor", "ret"],
  none: ["Not submitted", "miss"],
};

const CHIP: Record<Perspective, Record<DocState, string>> = {
  staff: { approved: "", missing: "missing", returned: "returned", pending: "with accreditor", draft: "draft" },
  rep: { approved: "", missing: "upload now", returned: "revise", pending: "with accreditor", draft: "draft" },
};

export default function ProgramProgress({
  program,
  input,
  perspective,
  documentsHref,
}: {
  /** Shown under the stage title in the dialog, e.g. "BSIT · Level I". */
  program: string;
  input: ProgressInput;
  perspective: Perspective;
  /** Where "Go to documents" leads (rep only). */
  documentsHref?: string;
}) {
  const snap = computeProgress(input);
  const staff = perspective === "staff";
  const each = +(25 / snap.total).toFixed(1);

  const open = input.areas.filter((a) => a.state !== "approved");
  const red = open.filter((a) => a.state === "missing" || a.state === "returned");
  const amber = open.filter((a) => a.state === "pending" || a.state === "draft");
  const chips: ProgressChip[] = open.map((a) => ({
    label: a.name.split(" – ")[0],
    caption: CHIP[perspective][a.state],
    tone: a.state === "pending" || a.state === "draft" ? "amber" : "red",
    href: staff ? undefined : documentsHref,
  }));

  const details: React.ReactNode[] = [
    <div key="0">
      <table>
        <tbody>
          <tr>
            <th>Internal accreditor</th>
            <th>Status</th>
          </tr>
          {input.accreditors.length ? (
            input.accreditors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>
                  <Pill tone={a.accepted ? "ok" : "pend"}>{a.accepted ? "Accepted" : "Awaiting acceptance"}</Pill>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} style={{ color: "var(--red)" }}>
                No accreditors assigned yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {staff && (
        <div className="sub" style={{ marginTop: 10 }}>
          Survey visit: <b>{input.visit || "—"}</b>
        </div>
      )}
    </div>,

    <table key="1">
      <tbody>
        <tr>
          <th>Area</th>
          <th>Status</th>
          <th>Counts?</th>
        </tr>
        {input.areas.map((a, i) => (
          <tr key={`${a.name}${i}`}>
            <td>
              {a.name}
              {a.remark && <small style={{ display: "block", color: "var(--red)" }}>↺ {a.remark}</small>}
            </td>
            <td>
              <Pill tone={AREA_PILL[a.state][1]}>{AREA_PILL[a.state][0]}</Pill>
            </td>
            <td style={{ whiteSpace: "nowrap" }}>
              {a.state === "approved" ? (
                <b style={{ color: "var(--green)" }}>{staff ? `✓ +${each}%` : "✓ counted"}</b>
              ) : (
                <span style={{ color: "var(--red)" }}>✕ not yet</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>,

    staff ? (
      <table key="2">
        <tbody>
          <tr>
            <th>Accreditor</th>
            <th>Report</th>
          </tr>
          {input.accreditors.length ? (
            input.accreditors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>
                  <Pill tone={REPORT_PILL[a.report][1]}>{REPORT_PILL[a.report][0]}</Pill>
                  {a.grandMean != null && <small> grand mean {a.grandMean.toFixed(2)}</small>}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2}>No accreditors yet</td>
            </tr>
          )}
        </tbody>
      </table>
    ) : (
      <div key="2" className="empty">
        After all documents are accepted, the internal accreditors submit their signed evaluation reports and QAC acknowledges them. You will get a notification at each step.
      </div>
    ),

    input.result && staff ? (
      <div key="3" className="result">
        <div className="ck">✓</div>
        <h3>{input.result}</h3>
        <p>Recorded by QAC. The record moves to the Accreditation Archive.</p>
      </div>
    ) : (
      <div key="3" className="empty">
        {staff ? (
          "The result is recorded after both reports are acknowledged and the visit is done."
        ) : (
          <>
            QAC records the result after the survey visit. The finished accreditation then moves to the <b>Accreditation Archive</b>.
          </>
        )}
      </div>
    ),
  ];

  const stages: ProgressStageView[] = PROGRESS_STAGES.map((s, i) => ({
    title: s.title,
    hint: s.hint,
    summary: snap.summaries[i],
    fraction: snap.fractions[i],
    detail: details[i],
    action: !staff && i === 1 && documentsHref ? { label: "Go to documents ›", href: documentsHref } : undefined,
  }));

  return (
    <AccreditationProgress
      title={staff ? "Accreditation Progress" : `Accreditation Progress · ${program.split(" · ")[1] ?? program}`}
      sub={
        staff ? (
          <>
            4 stages · 25% each · moves only when the work is <b>accepted</b>, not when a file is uploaded
          </>
        ) : (
          <>
            Moves only when the internal accreditors <b>accept</b> your documents, not when you upload them
          </>
        )
      }
      percent={snap.percent}
      stages={stages}
      attention={
        open.length
          ? {
              redCount: red.length,
              redLabel: staff ? "not ready" : "need your action",
              redNote: staff ? "missing or returned" : "not uploaded or returned",
              amberCount: amber.length,
              amberLabel: "waiting",
              amberNote: "uploaded, not yet accepted",
              chips,
            }
          : undefined
      }
      note={
        staff
          ? "Pre-Accreditation Phases are optional (extension monitoring), so they are not counted. The AACCUP external visit is outside the system: QAC records its result in stage 4."
          : "Pre-Accreditation Phases are optional (extension monitoring), so they are not counted here. Click a stage to see the details."
      }
      program={program}
    />
  );
}
