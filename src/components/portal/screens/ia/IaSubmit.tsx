"use client";

import Link from "next/link";
import { useState } from "react";
import useNav from "../../kit/nav";
import useBusy from "../../kit/useBusy";
import Btn from "../../kit/Btn";
import EvaluationReport, { roman, type ReportData } from "../../kit/EvaluationReport";
import Scope from "../../kit/Scope";
import { useToast } from "../../kit/ToastProvider";
import { areaMean, describeMean, includedAreas } from "@/lib/review-model";
import { grandMean, iaStats, type IaAssignment } from "@/lib/ia-model";
import { areaShort, areaTag, shortDate } from "@/lib/program-names";
import { saveReportDraft, signAccreditorReport } from "@/lib/review-actions";

const STEPS = ["Review ratings", "Preview report", "Sign", "Submitted"];
const DEFAULT_REC = "The program is recommended to proceed to the next stage, subject to the revisions noted below.";

const tlSigner = (n: string) => (n.includes(",") ? `${n.split(",")[1].trim()} ${n.split(",")[0]}` : n);

export type Signer = { id: string; name: string; signatureUrl: string | null; signedAt: string | null; me: boolean };

export default function IaSubmit({
  a,
  step: initialStep,
  me,
  signers,
}: {
  a: IaAssignment;
  step: number;
  me: { name: string; signatureUrl: string | null };
  signers: Signer[];
}) {
  const signed = a.report?.status === "submitted" || a.report?.status === "acknowledged";
  const [step, setStep] = useState(signed ? 3 : Math.min(initialStep, 2));
  const [overall, setOverall] = useState(a.report?.findings ?? "");
  const [rec, setRec] = useState(a.report?.recommendation || DEFAULT_REC);
  const [att, setAtt] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pending, start] = useBusy();
  const toast = useToast();
  const router = useNav();
  const r = a.review!;
  const areas = includedAreas(r);
  const gm = grandMean(a);
  const s = iaStats(a);
  const leader = a.role === "leader";
  const lead = a.team.find((m) => m.leader);
  const leadName = leader ? me.name : (a.mate?.name ?? lead?.name ?? me.name);
  const asstName = leader ? (a.mate?.name ?? null) : me.name;
  const mate = a.mate?.short ?? "your teammate";
  const asstSlots = areas.filter((x) => (leader ? !a.mine.includes(x.refId) : a.mine.includes(x.refId)));
  const asstAreas = asstSlots.map((x) => areaTag(r.levelCode, x.ordinal, x.name)).join(", ");
  const asstSentAt = leader ? a.mateSentAt : a.mySentAt;
  const first = (n: string) => n.split(",")[0];
  const signedFull = a.report?.signedAt
    ? new Date(a.report.signedAt).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  const signedDate = a.report?.signedAt
    ? new Date(a.report.signedAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila", month: "long", day: "numeric", year: "numeric" })
    : null;

  const report: ReportData = {
    program: a.program,
    collegeCampus: `${a.collegeName} · ${a.campus}`,
    levelName: a.levelName,
    visitLabel: a.visitLabel,
    accreditor: leadName,
    evaluatedOn: signedDate,
    team: { leader: leadName, assistant: asstName, assistantAreas: asstAreas },
    rows: areas.map((x) => {
      const byLeader = a.leaderAreaIds.includes(x.refId);
      return { roman: roman(x.ordinal), title: areaShort(x.name), mean: areaMean(a.ratings[x.refId]), ratedBy: byLeader ? `${first(leadName)} (TL)` : first(asstName ?? "") };
    }),
    improvements: areas
      .map((x) => ({
        roman: roman(x.ordinal),
        remarks: [1, 2, 3].map((i) => a.ratings[x.refId]?.[i]?.remark?.trim()).filter((v): v is string => Boolean(v)),
      }))
      .filter((x) => x.remarks.length),
    findings: overall,
    recommendation: rec,
    signers: [
      {
        name: tlSigner(leadName),
        role: "Team Leader",
        signatureUrl: signers.find((x) => x.id === lead?.id)?.signatureUrl ?? (leader ? me.signatureUrl : null),
        signedAt: signed ? signedFull : null,
        pending: "Pending signature",
      },
      ...(asstName
        ? [{ name: tlSigner(asstName), role: "Assistant Accreditor", note: `✓ ${asstAreas} sent ${asstSentAt ? shortDate(asstSentAt) : "—"}` }]
        : []),
      { name: "Director", role: "Quality Assurance Center", pending: "For acknowledgment" },
    ],
    docId: signed ? a.report?.code : null,
    signedFull,
  };

  function go(n: number) {
    setStep(n);
    window.scrollTo(0, 0);
  }

  return (
    <Scope name="ia">
      <div className="crumb">
        <Link href="/portal/evaluation">Programs</Link> › <Link href={`/portal/evaluation?a=${a.id}&st=req`}>{a.mid}</Link> › Overall report
      </div>
      <div className="steps">
        {STEPS.map((x, i) => (
          <div key={x} className={`stp ${i < step ? "done" : i === step ? "on" : ""}`}>
            <i>{i < step ? "✓" : i + 1}</i>
            <span>{x}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card">
          <h2>Generate overall report · {a.mid}</h2>
          <div className="sub">
            {a.levelName} · Check the ratings before signing · combines your areas and {mate}’s areas
          </div>
          <div className="sum">
            <div>
              <span>Areas rated</span>
              <b>
                {s.evalN + s.mateN} / {s.areaTotal + s.mateTotal}
              </b>
            </div>
            <div>
              <span>Grand mean</span>
              <b>{gm.toFixed(2)}</b>
              <span>{describeMean(gm)}</span>
            </div>
            <div>
              <span>Still returned for revision</span>
              <b style={{ color: "var(--red)" }}>{s.returned}</b>
              <span>{s.returned ? "" : "All clear"}</span>
            </div>
          </div>
          <table>
            <tbody>
              <tr>
                <th>Area</th>
                <th>Mean rating</th>
                <th>Description</th>
                <th>Rated by</th>
                <th />
              </tr>
              {areas.map((x) => {
                const m = areaMean(a.ratings[x.refId]);
                const own = a.mine.includes(x.refId);
                return (
                  <tr key={x.refId}>
                    <td>{x.name}</td>
                    <td>
                      <span className="sbar">
                        <i style={{ width: `${(m / 5) * 100}%`, background: m >= 4 ? "var(--green)" : m >= 3.5 ? "var(--gold)" : "#e0a33a" }} />
                      </span>
                      {m.toFixed(2)}
                    </td>
                    <td>{describeMean(m)}</td>
                    <td>{own ? "You" : mate}</td>
                    <td style={{ textAlign: "right" }}>
                      {own ? (
                        <Link className="lnk" href={`/portal/evaluation?a=${a.id}&st=req&ar=${x.refId}`}>
                          Edit
                        </Link>
                      ) : (
                        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>View only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <label className="l">Overall findings *</label>
          <textarea value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Summarize the program’s strengths and main gaps…" />
          <label className="l">Recommendation</label>
          <textarea value={rec} onChange={(e) => setRec(e.target.value)} />
          <div className="acts">
            <Btn variant="o" href={`/portal/evaluation?a=${a.id}&st=req`}>
              ‹ Back to areas
            </Btn>
            <Btn
              disabled={!overall.trim() || pending}
              onClick={() =>
                start(async () => {
                  await saveReportDraft(a.id, overall, rec);
                  go(1);
                })
              }
            >
              Preview report ›
            </Btn>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <h2>Preview report</h2>
          <div className="sub">This is exactly what will be signed and sent to the QA Center.</div>
          <div className="paperwrap">
            <EvaluationReport d={report} />
          </div>
          <div className="acts">
            <Btn variant="o" onClick={() => go(0)}>
              ‹ Edit
            </Btn>
            <Btn onClick={() => go(2)}>Continue to sign ›</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Sign the overall report</h2>
          <div className="sub">Your saved e-signature will be placed on the report.</div>
          <div className="sigbox" style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 12 }}>
            <div className="pre">{me.signatureUrl ? <img src={me.signatureUrl} alt="Your signature" style={{ maxWidth: 200, maxHeight: 66 }} /> : <span style={{ fontSize: 12, color: "var(--red)" }}>No saved signature</span>}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <b>{me.name}</b>
              <br />
              Team Leader
              <br />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>From Profile → E-signature</span>
              <br />
              <Link className="lnk" href="/portal/profile">
                Change signature
              </Link>
            </div>
          </div>
          <label className="chk">
            <input type="checkbox" checked={att} onChange={(e) => setAtt(e.target.checked)} />I certify that I personally reviewed the documents of this program
            and that the ratings and findings in this report are true and my own. I understand that once signed, this report can no longer be edited.
          </label>
          <div className="pw">
            <label className="l" style={{ marginTop: 0 }}>
              Confirm your password
            </label>
            <input type="password" placeholder="Password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <small>We ask this once so no one else can sign using your account.</small>
          </div>
          <div className="acts">
            <Btn variant="o" onClick={() => go(1)}>
              ‹ Back to preview
            </Btn>
            <Btn
              disabled={!(att && pwd.length >= 4) || pending || !me.signatureUrl}
              onClick={() =>
                start(async () => {
                  const res = await signAccreditorReport({ assignmentId: a.id, findings: overall, recommendation: rec, grandMean: gm, password: pwd });
                  if (!res.ok) return toast.say(res.error, true);
                  toast.say("Overall report submitted to the QAC Coordinator");
                  router.replace(`/portal/evaluation/submit?a=${a.id}&step=3`);
                  router.refresh();
                })
              }
            >
              ✍ Sign &amp; submit
            </Btn>
          </div>
        </div>
      )}

      {step === 3 && signed && (
        <>
          <div className="card">
            <div className="done">
              <div className="ck">✓</div>
              <h2>Overall report signed and submitted</h2>
              <p>
                {a.mid} · {a.levelName} · {signedFull}
              </p>
              <div className="team">
                <span>{leader ? `✅ ${me.name} (you) · signed` : `✅ ${leadName} · signed`}</span>
                {asstName && <span>{leader ? `👁 ${asstName} (Assistant) · can view the report` : `👁 ${me.name} (you) · can view the report`}</span>}
              </div>
              <p style={{ marginTop: 12 }}>Sent to the QAC Coordinator for acknowledgment. The report is now locked.</p>
            </div>
            <div className="acts noprint" style={{ justifyContent: "center" }}>
              <Btn variant="o" onClick={() => window.print()}>
                ⬇ Download PDF
              </Btn>
              <Btn href="/portal/dashboard">Back to Dashboard</Btn>
            </div>
          </div>
          <div className="paperwrap">
            <EvaluationReport d={report} />
          </div>
        </>
      )}
    </Scope>
  );
}
