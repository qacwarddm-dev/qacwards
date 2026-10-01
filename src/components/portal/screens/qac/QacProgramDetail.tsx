"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import SegTabs from "../../kit/SegTabs";
import StageSwitch from "../../kit/StageSwitch";
import SumRows from "../../kit/SumRows";
import { useToast } from "../../kit/ToastProvider";
import CertStatusSelect, { CSDEF } from "../../kit/CertStatusSelect";
import { LVS, phaseCounts, qacStatus, readiness, type QacProgram } from "@/lib/qac-model";
import { countSlots, describeMean, includedAreas, type Slot } from "@/lib/review-model";
import { areaShort, shortDate } from "@/lib/program-names";
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
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const c = phaseCounts(p);
  const areas = p.review ? includedAreas(p.review) : [];
  const a = countSlots(areas);
  const active = p.team.filter((m) => m.response !== "rejected");
  const sub = p.reports.filter((r) => r.status === "submitted" || r.status === "acknowledged").length;
  const [stage, setStage] = useState<Stage>(initialStage ?? (p.reports.some((r) => r.status === "submitted") ? "rep" : c.pe ? "pre" : "req"));
  const [full, setFull] = useState<Slot | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [ret, setRet] = useState<string | null>(null);
  const [retNote, setRetNote] = useState("");
  const [result, setResult] = useState(false);
  const s = qacStatus(p, today);
  const approvedPct = c.req ? Math.round((c.ap / c.req) * 100) : 0;

  function remind(id: string, name: string) {
    start(async () => {
      const r = await sendReminder(id, `Reminder from QAC: ${p.short} ${p.levelName} is waiting for you.`, "/portal/assignment");
      toast.say(r.ok ? `Reminder sent to ${name}` : r.error, !r.ok);
    });
  }

  function decide(accId: string, decision: "acknowledged" | "returned", note?: string) {
    start(async () => {
      const r = await reviewReport(p.assignmentId!, accId, decision, note);
      if (!r.ok) return toast.say(r.error, true);
      setReport(null);
      setRet(null);
      toast.say(decision === "acknowledged" ? "Report acknowledged. The accreditor was notified." : "Returned to the accreditor");
      router.refresh();
    });
  }

  const allAck = active.length > 0 && active.every((m) => p.reports.find((r) => r.accreditorId === m.id)?.status === "acknowledged");
  const reportOf = (id: string) => p.reports.find((r) => r.accreditorId === id);
  const viewing = report ? active.find((m) => m.id === report) : null;
  const vr = viewing ? reportOf(viewing.id) : null;

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
              title: "Evaluation Reports",
              sub: <>{sub} of {Math.max(2, active.length)} submitted{p.reports.some((r) => r.status === "submitted") ? <> · <b style={{ color: "#1f4fa3" }}>for your review</b></> : null}</>,
              pct: Math.round((sub / Math.max(2, active.length)) * 100),
              done: sub >= 2,
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
          (!active.length ? (
            <Empty icon="👥" title="No accreditors yet">
              Assign two internal accreditors first.
              <br />
              <Btn className="mt12" href={`/portal/assignment?new=1&edit=${p.id}`}>
                ＋ Assign accreditors
              </Btn>
            </Empty>
          ) : (
            <>
              <div className="evrs">
                {active.map((m) => {
                  const e = reportOf(m.id);
                  const S: [string, "blue" | "ok" | "ret" | "miss" | "pend"] =
                    e?.status === "submitted"
                      ? ["For your review", "blue"]
                      : e?.status === "acknowledged"
                        ? ["Acknowledged", "ok"]
                        : e?.status === "returned"
                          ? ["Returned to accreditor", "ret"]
                          : m.response === "pending"
                            ? ["Hasn’t accepted", "miss"]
                            : ["Evaluating", "pend"];
                  const signed = e && e.status !== "draft" && e.signedAt;
                  return (
                    <div key={m.id} className="evr">
                      <div className="evh">
                        <span className="av2">{m.surname.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <b>{m.name}</b>
                          <small>{m.acting ? "Acting internal accreditor" : "Internal Accreditor"}</small>
                        </div>
                        <Pill tone={S[1]}>{S[0]}</Pill>
                      </div>
                      {signed ? (
                        <>
                          <SumRows
                            rows={[
                              ["Grand mean", `${Number(e.grandMean ?? 0).toFixed(2)} · ${describeMean(Number(e.grandMean ?? 0))}`],
                              ["Signed", shortDate(e.signedAt)],
                              ["Document ID", <b key="d" style={{ fontSize: 12 }}>{e.code}</b>],
                            ]}
                          />
                          {e.qacNote && e.status === "returned" && (
                            <div className="rem" style={{ marginTop: 10 }}>
                              ↺ <b>Your remark:</b> {e.qacNote}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="evp">
                          <RBar pct={areas.length ? ((p.rated[m.id] ?? 0) / areas.length) * 100 : 0} color="var(--maroon)" label={`${p.rated[m.id] ?? 0}/${areas.length}`} />
                          <small>areas rated · report not submitted yet</small>
                        </div>
                      )}
                      <div className="evf">
                        {signed && (
                          <Btn variant="o" sm onClick={() => setReport(m.id)}>
                            📄 View report
                          </Btn>
                        )}
                        {e?.status === "submitted" && (
                          <>
                            <Btn variant="d" sm onClick={() => (setRet(m.id), setRetNote(""))}>
                              ↺ Return
                            </Btn>
                            <Btn sm disabled={pending} onClick={() => decide(m.id, "acknowledged")}>
                              ✓ Acknowledge
                            </Btn>
                          </>
                        )}
                        {!signed && m.response !== "pending" && (
                          <Btn variant="gh" sm disabled={pending} onClick={() => remind(m.id, m.name)}>
                            Send reminder
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="subbar">
                <span className="sub" style={{ margin: 0 }}>
                  {p.result ? (
                    <>
                      ✅ Result recorded: <b>{p.result}</b>.
                    </>
                  ) : allAck ? (
                    "✅ Both reports acknowledged. Record the visit result to close this level."
                  ) : (
                    "Acknowledge both signed reports to record the visit result."
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
          title={`Evaluation report · ${viewing.name}`}
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
                  <Btn loading={pending} onClick={() => decide(viewing.id, "acknowledged")}>
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
              rows: areas.map((x) => ({ roman: roman(x.ordinal), title: areaShort(x.name), mean: p.areaMeans[viewing.id]?.[x.refId] ?? 0 })),
              improvements: [],
              findings: vr.findings,
              recommendation: vr.recommendation,
              signers: [{ name: viewing.name, role: "Internal Accreditor", signedAt: shortDate(vr.signedAt) }],
              docId: vr.code,
            }}
          />
        </Modal>
      )}
      {ret && (
        <Modal
          title={`Return report to ${active.find((m) => m.id === ret)?.name}`}
          sub="The accreditor can edit and sign again. The program rep doesn’t see this."
          onClose={() => setRet(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setRet(null)}>
                Cancel
              </Btn>
              <Btn variant="d" loading={pending} onClick={() => (retNote.trim() ? decide(ret, "returned", retNote) : toast.say("Add a remark first", true))}>
                ↺ Return report
              </Btn>
            </>
          }
        >
          <label className="fl">What should the accreditor fix? *</label>
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
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Modal
      title={`Record visit result · ${p.short}`}
      sub={`${p.levelName} · ${p.visitLabel} · grand means ${p.reports.map((r) => Number(r.grandMean ?? 0).toFixed(2)).join(" and ")}`}
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
