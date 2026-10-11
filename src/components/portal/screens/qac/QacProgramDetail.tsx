"use client";

import { useState } from "react";
import useNav from "../../kit/nav";
import useBusy from "../../kit/useBusy";
import AccreditorChips from "../../kit/AccreditorChips";
import BackLink from "../../kit/BackLink";
import { RBar } from "../../kit/Bar";
import Btn from "../../kit/Btn";
import Card from "../../kit/Card";
import Crumbs from "../../kit/Crumbs";
import DocRow from "../../kit/DocRow";
import Empty from "../../kit/Empty";
import EvaluationReport, { roman } from "../../kit/EvaluationReport";
import FullScreenViewer from "../../kit/FullScreenViewer";
import LevelRings from "../../kit/LevelRings";
import Modal from "../../kit/Modal";
import Pill from "../../kit/Pill";
import ProgramProgress from "../../kit/ProgramProgress";
import SegTabs from "../../kit/SegTabs";
import StageSwitch from "../../kit/StageSwitch";
import SumRows from "../../kit/SumRows";
import { useToast } from "../../kit/ToastProvider";
import CertStatusSelect, { CSDEF } from "../../kit/CertStatusSelect";
import { LVS, assistantOf, leaderOf, overallReport, phaseCounts, qacStatus, readiness, type QacProgram } from "@/lib/qac-model";
import { programProgressInput } from "@/lib/progress-model";
import { countSlots, describeMean, includedAreas, type Slot } from "@/lib/review-model";
import { areaShort, areaTag, shortDate } from "@/lib/program-names";
import { recordVisitResult, reviewReport, sendReminder } from "@/lib/qac-actions";

type Stage = "pre" | "req" | "rep";

const AST: Record<string, [string, "ok" | "pend" | "ret" | "miss"]> = {
  approved: ["Approved by accreditor", "ok"],
  pending: ["With accreditor", "pend"],
  returned: ["Returned to program", "ret"],
  missing: ["Not uploaded", "miss"],
  draft: ["Not uploaded", "miss"],
};

export default function QacProgramDetail({ p, today, initialStage }: { p: QacProgram; today: string; initialStage?: Stage }) {
  const router = useNav();
  const toast = useToast();
  const [pending, start] = useBusy();
  const c = phaseCounts(p);
  const areas = p.review ? includedAreas(p.review) : [];
  const a = countSlots(areas);
  const active = p.team.filter((m) => m.response !== "rejected");
  const lead = leaderOf(p);
  const asst = assistantOf(p);
  const e = overallReport(p);
  const signedReport = e?.status === "submitted" || e?.status === "acknowledged";
  const [stage, setStage] = useState<Stage>(initialStage ?? (e?.status === "submitted" ? "rep" : c.pe ? "pre" : "req"));
  const [full, setFull] = useState<Slot | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [ret, setRet] = useState<string | null>(null);
  const [retNote, setRetNote] = useState("");
  const [result, setResult] = useState(false);
  const s = qacStatus(p, today);
  const approvedPct = c.req ? Math.round((c.ap / c.req) * 100) : 0;

  function remind(id: string, name: string) {
    return start(async () => {
      const r = await sendReminder(id, `Reminder from QAC: ${p.short} ${p.levelName} is waiting for you.`, "/portal/assignment");
      toast.say(r.ok ? `Reminder sent to ${name}` : r.error, !r.ok);
    });
  }

  function decide(accId: string, decision: "acknowledged" | "returned", note?: string) {
    return start(async () => {
      const r = await reviewReport(p.assignmentId!, accId, decision, note);
      if (!r.ok) return toast.say(r.error, true);
      setReport(null);
      setRet(null);
      toast.say(decision === "acknowledged" ? "Overall report acknowledged. Both accreditors were notified." : "Returned to the Team Leader");
      router.refresh();
    });
  }

  const allAck = e?.status === "acknowledged";
  const tlSlots = areas.filter((x) => p.leaderAreaIds.includes(x.refId));
  const asSlots = areas.filter((x) => !p.leaderAreaIds.includes(x.refId));
  const tags = (L: Slot[]) => L.map((x) => areaTag(p.levelCode, x.ordinal, x.name)).join(", ");
  const viewing = report && lead ? lead : null;
  const vr = viewing ? e : null;

  return (
    <>
      <Crumbs items={[{ label: "Programs", href: "/portal/assignment" }, { label: p.short }]} />
      <Card>
        <div className="ch">
          <div>
            <h2>{p.name}</h2>
            <div className="sub">
              {p.collegeName} · {p.campus}
            </div>
          </div>
          <BackLink to="Programs" href="/portal/assignment" />
        </div>
        <SumRows
          four
          rows={[
            ["Level", p.levelName],
            ["Survey visit", p.visitLabel],
            ["Program rep", p.rep],
            ["Status", <b key="s"><Pill tone={s.c}>{s.t}</Pill></b>],
          ]}
        />
        <div className="iarow">
          <span className="fl" style={{ margin: 0 }}>
            Internal accreditors
          </span>
          <AccreditorChips team={p.team} />
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {active.filter((m) => m.response === "pending").map((m) => (
              <Btn key={m.id} variant="gh" sm disabled={pending} onClick={() => remind(m.id, m.name)}>
                Send reminder
              </Btn>
            ))}
            <Btn variant="o" sm href={`/portal/assignment?new=1&edit=${p.id}`}>
              {active.length < 2 ? "＋ Assign accreditors" : "Edit assignment"}
            </Btn>
          </span>
        </div>
      </Card>
      {p.inproc && <ProgramProgress program={`${p.short} · ${p.levelName}`} input={programProgressInput(p)} perspective="staff" />}
      <Card>
        <LevelRings
          items={LVS.map(([k, sh, nm]) => {
            const cur = k === p.levelCode;
            const dn = p.awardedCodes.includes(k);
            const pc = cur ? readiness(p) : dn ? 100 : 0;
            return {
              key: k,
              short: sh,
              pct: pc,
              center: cur || dn ? `${pc}%` : "—",
              pill: cur ? { tone: "blue", text: "Current level" } : dn ? { tone: "ok", text: "Visit passed" } : { tone: "miss", text: "Not started" },
              sub: cur ? "Program readiness" : dn ? "Completed" : "—",
              locked: !cur,
              selected: cur,
              onClick: cur ? undefined : () => toast.say(dn ? `${nm} was completed.` : `${nm} hasn’t started for this program.`),
            };
          })}
        />
      </Card>
      <Card>
        <StageSwitch
          value={stage}
          onChange={setStage}
          stages={[
            { key: "pre", title: "Pre-Accreditation Phases", sub: <>{c.ap} of {c.req} approved{c.pe ? <> · <b style={{ color: "#8a6d00" }}>{c.pe} for your review</b></> : null}</>, pct: approvedPct, done: approvedPct === 100 },
            { key: "req", title: "Accreditation Requirements", sub: `${a.ap} of ${areas.length} approved by accreditors${a.pe ? ` · ${a.pe} with accreditors` : ""}`, pct: areas.length ? Math.round((a.ap / areas.length) * 100) : 0, done: areas.length > 0 && a.ap === areas.length },
            {
              key: "rep",
              title: "Overall Evaluation Report",
              sub: <>{signedReport ? "Submitted by the Team Leader" : "Not submitted yet"}{e?.status === "submitted" ? <> · <b style={{ color: "#1f4fa3" }}>for your review</b></> : null}</>,
              pct: e?.status === "acknowledged" ? 100 : signedReport ? 50 : 0,
              done: e?.status === "acknowledged",
            },
          ]}
        />
        {stage === "pre" && (
          <>
            <div className="lockb" style={{ background: "#f6f6f6" }}>
              🔎{" "}
              <div>
                You approve the phase documents in <b>Extension Monitoring</b>. This is a summary.
              </div>
            </div>
            <div className="box">
              {(p.review?.phases ?? []).map((g) => {
                const x = countSlots(g.docs);
                const done = x.ap === x.req;
                const pct = x.req ? Math.round((x.ap / x.req) * 100) : 0;
                return (
                  <DocRow
                    key={g.id}
                    variant="q3"
                    state={done ? "approved" : x.pe ? "pending" : "missing"}
                    icon={done ? "✓" : g.ordinal}
                    title={g.name}
                    sub={`${x.ap} approved · ${x.pe} for your review · ${x.miss} not uploaded${x.re ? ` · ${x.re} returned` : ""}`}
                    status={<RBar pct={pct} />}
                    actions={
                      <Btn variant={x.pe ? "s" : "o"} sm href={`/portal/extension-monitoring?p=${p.id}&g=${g.ordinal}`}>
                        {x.pe ? `Review ${x.pe}` : "Open"}
                      </Btn>
                    }
                    onClick={() => router.push(`/portal/extension-monitoring?p=${p.id}&g=${g.ordinal}`)}
                  />
                );
              })}
            </div>
          </>
        )}
        {stage === "req" && (
          <>
            <div className="lockb" style={{ background: "#f6f6f6" }}>
              👁{" "}
              <div>
                The internal accreditors approve and rate these documents. You can <b>view</b> each one.
              </div>
            </div>
            <div className="box">
              {areas.map((x) => (
                <DocRow
                  key={x.key}
                  state={x.state}
                  title={x.name}
                  sub={
                    x.state === "missing"
                      ? "Not uploaded by the program yet"
                      : `${x.file} · ${x.date}${x.version > 1 ? ` · v${x.version}` : ""}${x.reviewedBy ? ` · approved by ${x.reviewedBy.split(",")[0]}` : x.returnedBy ? ` · reviewed by ${x.returnedBy.split(",")[0]}` : ""}`
                  }
                  status={<Pill tone={AST[x.state][1]}>{AST[x.state][0]}</Pill>}
                  actions={
                    x.state === "missing" ? (
                      <span className="wt">—</span>
                    ) : (
                      <Btn variant="o" sm onClick={() => setFull(x)}>
                        View
                      </Btn>
                    )
                  }
                  remark={x.returnNote ? { who: (x.returnedBy ?? "").split(",")[0], text: x.returnNote } : null}
                />
              ))}
            </div>
          </>
        )}
        {stage === "rep" &&
          (!active.length || !lead ? (
            <Empty icon="👥" title="No accreditors yet">
              Assign two internal accreditors first.
              <br />
              <Btn className="mt12" href={`/portal/assignment?new=1&edit=${p.id}`}>
                ＋ Assign accreditors
              </Btn>
            </Empty>
          ) : (
            <>
              <div className="lockb" style={{ background: "#f6f6f6" }}>
                👥{" "}
                <div>
                  The <b>Team Leader</b> combines both accreditors’ ratings into <b>one overall evaluation report</b>, signs it and submits it to you. The Assistant rates their own areas and can only view the report.
                </div>
              </div>
              <div className="evrs">
                <div className="evr">
                  <div className="evh">
                    <span className="av2">{lead.surname.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <b>{lead.name}</b>
                      <small>
                        {lead.acting ? "Acting internal accreditor · " : ""}Team Leader · {tags(tlSlots)}
                      </small>
                    </div>
                    {(() => {
                      const S: [string, "blue" | "ok" | "ret" | "miss" | "pend"] =
                        e?.status === "submitted"
                          ? ["For your review", "blue"]
                          : e?.status === "acknowledged"
                            ? ["Acknowledged", "ok"]
                            : e?.status === "returned"
                              ? ["Returned to Team Leader", "ret"]
                              : lead.response === "pending"
                                ? ["Hasn’t accepted", "miss"]
                                : ["Evaluating", "pend"];
                      return <Pill tone={S[1]}>{S[0]}</Pill>;
                    })()}
                  </div>
                  {e && signedReport && e.signedAt ? (
                    <>
                      <SumRows
                        rows={[
                          ["Overall grand mean", `${Number(e.grandMean ?? 0).toFixed(2)} · ${describeMean(Number(e.grandMean ?? 0))}`],
                          ["Signed", shortDate(e.signedAt)],
                          ["Document ID", <b key="d" style={{ fontSize: 12 }}>{e.code}</b>],
                        ]}
                      />
                    </>
                  ) : (
                    <>
                      {e?.status === "returned" && e.qacNote && (
                        <div className="rem" style={{ marginTop: 10 }}>
                          ↺ <b>Your remark:</b> {e.qacNote}
                        </div>
                      )}
                      <div className="evp">
                        <RBar pct={tlSlots.length ? (Math.min(p.rated[lead.id] ?? 0, tlSlots.length) / tlSlots.length) * 100 : 0} color="var(--maroon)" label={`${Math.min(p.rated[lead.id] ?? 0, tlSlots.length)}/${tlSlots.length}`} />
                        <small>own areas rated · overall report not submitted yet</small>
                      </div>
                    </>
                  )}
                  <div className="evf">
                    {signedReport && (
                      <Btn variant="o" sm onClick={() => setReport(lead.id)}>
                        📄 View overall report
                      </Btn>
                    )}
                    {e?.status === "submitted" && (
                      <>
                        <Btn variant="d" sm onClick={() => (setRet(lead.id), setRetNote(""))}>
                          ↺ Return
                        </Btn>
                        <Btn sm disabled={pending} onClick={() => decide(lead.id, "acknowledged")}>
                          ✓ Acknowledge
                        </Btn>
                      </>
                    )}
                    {!signedReport && lead.response !== "pending" && (
                      <Btn variant="gh" sm disabled={pending} onClick={() => remind(lead.id, lead.name)}>
                        Send reminder
                      </Btn>
                    )}
                  </div>
                </div>
                {asst && (
                  <div className="evr">
                    <div className="evh">
                      <span className="av2">{asst.surname.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <b>{asst.name}</b>
                        <small>
                          {asst.acting ? "Acting internal accreditor · " : ""}Assistant Accreditor · {tags(asSlots)}
                        </small>
                      </div>
                      <Pill tone={asst.sentAt ? "ok" : asst.response === "pending" ? "miss" : "pend"}>
                        {asst.sentAt ? "Areas sent to Team Leader" : asst.response === "pending" ? "Hasn’t accepted" : "Rating own areas"}
                      </Pill>
                    </div>
                    <div className="evp">
                      <small>
                        {asst.sentAt
                          ? `Submitted their ${asSlots.length} areas to ${lead.surname} on ${shortDate(asst.sentAt)}. Included in the overall report.`
                          : `Rates ${asSlots.length} areas, then sends them to the Team Leader. Doesn’t sign or submit a report.`}
                      </small>
                    </div>
                    <div className="evf">
                      {!asst.sentAt && asst.response !== "pending" && (
                        <Btn variant="gh" sm disabled={pending} onClick={() => remind(asst.id, asst.name)}>
                          Send reminder
                        </Btn>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="subbar">
                <span className="sub" style={{ margin: 0 }}>
                  {p.result ? (
                    <>
                      ✅ Result recorded: <b>{p.result}</b>.
                    </>
                  ) : allAck ? (
                    "✅ Overall report acknowledged. Record the visit result to close this level."
                  ) : (
                    "Acknowledge the Team Leader’s overall report to record the visit result."
                  )}
                </span>
                {!p.result && (
                  <Btn disabled={!allAck} onClick={() => setResult(true)}>
                    Record visit result ›
                  </Btn>
                )}
              </div>
            </>
          ))}
      </Card>
      {full && (
        <FullScreenViewer
          docId={full.docId}
          file={full.file ?? full.name}
          meta={`${p.short} · ${p.levelName} · ${full.name}`}
          note="Watermarked for viewers outside QAC · downloads are logged"
          onClose={() => setFull(null)}
        />
      )}
      {viewing && vr && (
        <Modal
          size="wide"
          title={`Overall evaluation report · ${viewing.surname} (Team Leader)`}
          sub={`${p.short} · ${p.levelName} · signed ${shortDate(vr.signedAt)}`}
          onClose={() => setReport(null)}
          bodyStyle={{ background: "#e9e9e9" }}
          footer={
            <>
              <Btn variant="gh" onClick={() => setReport(null)}>
                Close
              </Btn>
              {vr.status === "submitted" && (
                <>
                  <Btn variant="d" onClick={() => (setRet(viewing.id), setRetNote(""), setReport(null))}>
                    ↺ Return
                  </Btn>
                  <Btn disabled={pending} onClick={() => decide(viewing.id, "acknowledged")}>
                    ✓ Acknowledge
                  </Btn>
                </>
              )}
            </>
          }
        >
          <EvaluationReport
            variant="qac"
            d={{
              program: p.name,
              collegeCampus: `${p.collegeName} · ${p.campus}`,
              levelName: p.levelName,
              visitLabel: p.visitLabel,
              accreditor: viewing.name,
              evaluatedOn: shortDate(vr.signedAt),
              team: { leader: viewing.name, assistant: asst?.name ?? null, assistantAreas: tags(asSlots) },
              rows: areas.map((x) => {
                const mine = p.leaderAreaIds.includes(x.refId);
                const owner = mine ? viewing : asst;
                return { roman: roman(x.ordinal), title: areaShort(x.name), mean: (owner && p.areaMeans[owner.id]?.[x.refId]) || 0, ratedBy: mine ? `${viewing.surname} (TL)` : (asst?.surname ?? "") };
              }),
              improvements: [],
              findings: vr.findings,
              recommendation: vr.recommendation,
              signers: [{ name: viewing.name, role: "Team Leader", signedAt: shortDate(vr.signedAt) }],
              docId: vr.code,
            }}
          />
        </Modal>
      )}
      {ret && (
        <Modal
          title={`Return the overall report to ${lead?.name ?? "the Team Leader"}`}
          sub="The Team Leader can edit and sign again. The program rep doesn’t see this."
          onClose={() => setRet(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setRet(null)}>
                Cancel
              </Btn>
              <Btn variant="d" disabled={pending} onClick={() => (retNote.trim() ? decide(ret, "returned", retNote) : toast.say("Add a remark first", true))}>
                ↺ Return report
              </Btn>
            </>
          }
        >
          <label className="fl">What should the Team Leader fix? *</label>
          <textarea className="inp" rows={3} value={retNote} onChange={(e) => setRetNote(e.target.value)} placeholder="e.g. Area V rating has no remark explaining the low score." />
        </Modal>
      )}
      {result && p.assignmentId && <RecordResult p={p} onClose={() => setResult(false)} />}
    </>
  );
}

function RecordResult({ p, onClose }: { p: QacProgram; onClose: () => void }) {
  const [res, setRes] = useState<"Passed" | "Deferred">("Passed");
  const [cert, setCert] = useState(CSDEF[p.levelCode] ?? "Candidate Status");
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [until, setUntil] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [pending, start] = useBusy();
  const toast = useToast();
  const router = useNav();
  return (
    <Modal
      title={`Record visit result · ${p.short}`}
      sub={`${p.levelName} · ${p.visitLabel} · overall grand mean ${Number(overallReport(p)?.grandMean ?? 0).toFixed(2)}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="gh" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (!cert.trim()) return toast.say("Type the status written on the certificate", true);
                const r = await recordVisitResult({ assignmentId: p.assignmentId!, passed: res === "Passed", certStatus: cert, validFrom: from, validUntil: until || null });
                if (!r.ok) return toast.say(r.error, true);
                onClose();
                toast.say("Result saved. The next level is unlocked for the program rep.");
                router.refresh();
              })
            }
          >
            Save result
          </Btn>
        </>
      }
    >
      <label className="fl">Result</label>
      <SegTabs
        value={res}
        onChange={setRes}
        tabs={[
          { key: "Passed", label: "Passed" },
          { key: "Deferred", label: "Deferred" },
        ]}
      />
      <label className="fl" style={{ marginTop: 12 }}>
        Status on the certificate
      </label>
      <CertStatusSelect value={cert} onChange={setCert} />
      <div className="fg2">
        <div>
          <label className="fl">Valid from</label>
          <input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="fl">Valid until</label>
          <input className="inp" type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </div>
      </div>
      <div className="sub" style={{ fontSize: 12, marginTop: 10 }}>
        This records the award on the program and unlocks the next level for the program rep.
      </div>
    </Modal>
  );
}
