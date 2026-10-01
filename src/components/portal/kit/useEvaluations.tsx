"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Btn from "./Btn";
import Modal from "./Modal";
import Result from "./Result";
import { useToast } from "./ToastProvider";
import { saveVisitEvaluation } from "@/lib/visit-evaluation-actions";
import {
  SCALE,
  SURVEY_FORMS,
  initialAnswers,
  stepProblems,
  type Answers,
  type Question,
  type ScaleAnswer,
  type StepProblem,
} from "@/lib/visit-evaluation-forms";
import type { CompletedVisit, EvaluationTarget } from "@/lib/visit-evaluations";

export const evalTitle = (t: EvaluationTarget) =>
  t.kind === "qac_service" ? "QAC Service Evaluation" : `Internal Accreditor Evaluation · ${t.who}`;
export const evalBadge = (t: EvaluationTarget) => (t.kind === "qac_service" ? "QAC" : "IA");
export const pendingOf = (v: CompletedVisit) => v.targets.filter((t) => t.status !== "submitted");

const MODAL_TITLE = {
  qac_service: "QAC Service Evaluation",
  internal_accreditor: "Internal Accreditor Evaluation by the Local Task Force",
};
const MODAL_SUB = {
  qac_service: "For the accreditation visit and other assistance from the QA Center",
  internal_accreditor: "Help the QAC evaluate the internal accreditors who visited your program",
};

function FormModal({
  visit,
  target,
  onDone,
  onClose,
}: {
  visit: CompletedVisit;
  target: EvaluationTarget;
  onDone: (answers: Answers, submittedAt: string | null) => void;
  onClose: () => void;
}) {
  const form = SURVEY_FORMS[target.kind];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(() => initialAnswers(form, visit.visitLabel, target.answers));
  const [problems, setProblems] = useState<StepProblem[]>([]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const body = useRef<HTMLDivElement>(null);
  const s = form.steps[step];
  const last = step === form.steps.length - 1;
  const auto = { ...visit.auto, accreditor: target.who };
  const bad = (k: string) => problems.find((p) => p.key === k);

  function set(k: string, v: string | ScaleAnswer) {
    setAnswers((a) => ({ ...a, [k]: v }));
    setProblems((p) => p.filter((x) => x.key !== k));
  }

  async function next() {
    const pr = stepProblems(s, answers);
    setProblems(pr);
    if (pr.length) {
      setTimeout(() => document.querySelector(".q.err")?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
      return;
    }
    setBusy(true);
    const res = await saveVisitEvaluation({ assignmentId: target.assignmentId, kind: target.kind, accreditorId: target.accreditorId, answers, submit: last });
    setBusy(false);
    if (!res.ok) return toast.say(res.error, true);
    if (last) onDone(answers, res.submittedAt);
    else setStep(step + 1);
  }

  const q = (x: Question) => {
    if (x.kind === "auto")
      return (
        <div key={x.key} className="q">
          <label>
            {x.label}
            <span className="auto">Filled in for you</span>
          </label>
          <input className="inp" readOnly value={auto[x.key] ?? ""} style={{ background: "#f4f4f4" }} />
        </div>
      );
    if (x.kind === "choice")
      return (
        <div key={x.key} className={`q${bad(x.key) ? " err" : ""}`}>
          <label>
            {x.label} {x.required && <em>*</em>}
            {x.prefillVisit && <span className="auto">Filled in for you</span>}
          </label>
          <div className="opts">
            {x.options.map((o) => (
              <label key={o} className="opt2">
                <input type="radio" name={x.key} checked={answers[x.key] === o} onChange={() => set(x.key, o)} />
                {o}
              </label>
            ))}
          </div>
          <div className="emsg">{bad(x.key)?.message}</div>
        </div>
      );
    if (x.kind === "scale") {
      const cur = (answers[x.key] as ScaleAnswer) ?? {};
      const p = bad(x.key);
      return (
        <div key={x.key} className={`q${p ? " err" : ""}`}>
          <label>
            {x.label} <em>*</em>
          </label>
          <span className="h">{x.hint}</span>
          <table className="scale">
            <tbody>
              <tr>
                <th />
                {SCALE.map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
              {x.rows.map((r, i) => (
                <tr key={r} className={p?.rows?.includes(i) ? "err" : ""}>
                  <td>{r}</td>
                  {SCALE.map((n) => (
                    <td key={n}>
                      <input type="radio" name={`${x.key}${i}`} checked={cur[i] === n} onChange={() => set(x.key, { ...cur, [i]: n })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="emsg">Please rate every item.</div>
        </div>
      );
    }
    if (x.kind === "score")
      return (
        <div key={x.key} className={`q${bad(x.key) ? " err" : ""}`}>
          <label>
            {x.label} <em>*</em>
          </label>
          <span className="h">{x.hint}</span>
          <input className="inp" type="number" min={0} max={x.max} style={{ maxWidth: 140 }} value={(answers[x.key] as string) ?? ""} onChange={(e) => set(x.key, e.target.value)} />
          <div className="emsg">{bad(x.key)?.message}</div>
        </div>
      );
    return (
      <div key={x.key} className="q">
        <label>
          {x.label} <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
        </label>
        <textarea className="inp" rows={3} value={(answers[x.key] as string) ?? ""} onChange={(e) => set(x.key, e.target.value)} />
      </div>
    );
  };

  return (
    <Modal
      onClose={onClose}
      head={
        <div className="md-h">
          <button type="button" className="x" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h3>{MODAL_TITLE[target.kind]}</h3>
          <p>
            {target.kind === "internal_accreditor" && (
              <>
                Evaluating <b style={{ color: "var(--text)" }}>{target.who}</b> ·{" "}
              </>
            )}
            {visit.visitLabel} · {MODAL_SUB[target.kind]}
          </p>
          <div className="fsteps">
            {form.steps.map((_, i) => (
              <i key={i} className={i <= step ? "on" : ""} />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
            Step {step + 1} of {form.steps.length} · {s.name}
          </div>
        </div>
      }
      footerStyle={{ justifyContent: "space-between" }}
      footer={
        <>
          <Btn variant="gh" onClick={() => (step ? setStep(step - 1) : onClose())}>
            {step ? "‹ Back" : "Cancel"}
          </Btn>
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Answers are saved as you go</span>
          <Btn loading={busy} onClick={next}>
            {last ? "Submit" : "Next ›"}
          </Btn>
        </>
      }
    >
      <div ref={body}>{s.questions.map(q)}</div>
    </Modal>
  );
}

export function useEvaluations(visits: CompletedVisit[]) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, Partial<EvaluationTarget>>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [thanks, setThanks] = useState<{ key: string; again: boolean } | null>(null);
  const merged = visits.map((v) => ({ ...v, targets: v.targets.map((t) => ({ ...t, ...local[t.key] })) }));
  const all = merged.flatMap((v) => v.targets.map((t) => ({ v, t })));
  const find = (k: string | null) => all.find((x) => x.t.key === k);
  const open = (key: string) => {
    const f = find(key);
    if (!f) return;
    if (f.t.status === "submitted") setThanks({ key, again: true });
    else setOpenKey(key);
  };
  const cur = find(openKey);
  const th = find(thanks?.key ?? null);
  const left = th ? pendingOf(th.v).filter((t) => t.key !== th.t.key || !thanks?.again) : [];
  const submittedOn = (t: EvaluationTarget) =>
    t.submittedAt ? new Date(t.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }) : "";

  const modals = (
    <>
      {cur && (
        <FormModal
          key={cur.t.key}
          visit={cur.v}
          target={cur.t}
          onClose={() => setOpenKey(null)}
          onDone={(answers, submittedAt) => {
            setLocal((p) => ({ ...p, [cur.t.key]: { answers, status: "submitted", submittedAt } }));
            setOpenKey(null);
            setThanks({ key: cur.t.key, again: false });
            router.refresh();
          }}
        />
      )}
      {th && thanks && (
        <Modal
          onClose={() => setThanks(null)}
          footer={
            <>
              <Btn variant="gh" onClick={() => setThanks(null)}>
                Close
              </Btn>
              {left.length > 0 && (
                <Btn
                  onClick={() => {
                    setThanks(null);
                    setOpenKey(left[0].key);
                  }}
                >
                  Next evaluation ›
                </Btn>
              )}
            </>
          }
        >
          <Result tone="ok" title={thanks.again ? "Already submitted" : "Thank you for your feedback!"}>
            <p>
              {evalTitle(th.t).replace(" · ", " for ")} · submitted {submittedOn(th.t)}.
              <br />
              Your answers go straight to the QA Center.
            </p>
            {left.length ? (
              <p style={{ marginTop: 12, color: "var(--text)" }}>
                <b>{left.length}</b> evaluation{left.length > 1 ? "s" : ""} left for this visit.
              </p>
            ) : (
              <p style={{ marginTop: 12, color: "var(--text)" }}>🎉 All evaluations for this visit are done.</p>
            )}
          </Result>
        </Modal>
      )}
    </>
  );
  return { visits: merged, open, modals, submittedOn };
}
