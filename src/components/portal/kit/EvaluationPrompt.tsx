"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Btn from "./Btn";
import Modal from "./Modal";
import { evalBadge, evalTitle, pendingOf, useEvaluations } from "./useEvaluations";
import type { CompletedVisit } from "@/lib/visit-evaluations";

const key = (id: string) => `qacw:visit-eval-prompt:${id}`;
const snoozed = (id: string) => {
  try {
    return sessionStorage.getItem(key(id)) === "1";
  } catch {
    return false;
  }
};

/** "Preliminary Survey Visit complete!" — shown once per session per visit. */
export default function EvaluationPrompt({ visits }: { visits: CompletedVisit[] }) {
  const pathname = usePathname();
  const flow = useEvaluations(visits);
  const [shown, setShown] = useState<string | null>(null);
  const due = flow.visits.find((v) => pendingOf(v).length > 0);

  useEffect(() => {
    if (!due || pathname.startsWith("/portal/feedback") || snoozed(due.assignmentId)) return;
    const t = setTimeout(() => setShown(due.assignmentId), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due?.assignmentId]);

  const visit = flow.visits.find((v) => v.assignmentId === shown);
  const left = visit ? pendingOf(visit) : [];
  const dismiss = () => {
    try {
      if (shown) sessionStorage.setItem(key(shown), "1");
    } catch {}
    setShown(null);
  };
  const answer = (k: string) => {
    dismiss();
    flow.open(k);
  };

  return (
    <>
      {visit && left.length > 0 && (
        <Modal
          onClose={dismiss}
          head={
            <div className="pophero">
              <div className="big">🎉</div>
              <h3>{visit.visitLabel} complete!</h3>
              <p>
                Congratulations, {visit.programLabel}.{" "}
                {visit.nextLevel ? `Before moving on to ${visit.nextLevel}, please answer these short evaluations.` : "Please answer these short evaluations."}
              </p>
            </div>
          }
          footerStyle={{ justifyContent: "space-between" }}
          footer={
            <>
              <Btn variant="gh" onClick={dismiss}>
                Remind me later
              </Btn>
              <Btn onClick={() => answer(left[0].key)}>Start now</Btn>
            </>
          }
        >
          {left.map((t) => (
            <div key={t.key} className="evl">
              <div
                style={{ width: 38, height: 38, borderRadius: 10, background: "#fff6d6", color: "#8a6d00", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {evalBadge(t)}
              </div>
              <div>
                <b>{evalTitle(t)}</b>
                <small>{t.status === "draft" ? "Started, not yet submitted" : "About 3 minutes"}</small>
              </div>
              <div className="r">
                <Btn sm onClick={() => answer(t.key)}>
                  {t.status === "draft" ? "Continue" : "Answer"}
                </Btn>
              </div>
            </div>
          ))}
          <p className="sub">
            You can also find these anytime under <b>Feedback → Your evaluations</b>.
          </p>
        </Modal>
      )}
      {flow.modals}
    </>
  );
}
