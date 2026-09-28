"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Button, EvaluationTaskRow, Modal } from "../kit";
import type { CompletedVisit } from "@/lib/visit-evaluations";
import {
  evaluationBadge,
  evaluationTitle,
  outstanding,
  useVisitEvaluationFlow,
} from "./useVisitEvaluationFlow";

const HUB = "/portal/submission/evaluation";
const snoozeKey = (assignmentId: string) => `qacw:visit-eval-prompt:${assignmentId}`;

function snoozed(assignmentId: string) {
  try {
    return sessionStorage.getItem(snoozeKey(assignmentId)) === "1";
  } catch {
    return false;
  }
}

function snooze(assignmentId: string) {
  try {
    sessionStorage.setItem(snoozeKey(assignmentId), "1");
  } catch {}
}

export default function VisitEvaluationPrompt({ visits }: { visits: CompletedVisit[] }) {
  const pathname = usePathname();
  const flow = useVisitEvaluationFlow(visits);
  const [shownFor, setShownFor] = useState<string | null>(null);

  const due = flow.visits.find((v) => outstanding(v).length > 0);

  useEffect(() => {
    if (!due || pathname.startsWith(HUB) || snoozed(due.assignmentId)) return;
    const t = setTimeout(() => setShownFor(due.assignmentId), 500);
    return () => clearTimeout(t);
    // Only a different visit becoming due should re-trigger the prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due?.assignmentId]);

  const visit = flow.visits.find((v) => v.assignmentId === shownFor);
  const pending = visit ? outstanding(visit) : [];

  function dismiss() {
    if (shownFor) snooze(shownFor);
    setShownFor(null);
  }

  function answer(key: string) {
    dismiss();
    flow.open(key);
  }

  return (
    <>
      {visit && pending.length > 0 && (
        <Modal bare title={`${visit.visitLabel} complete`} onClose={dismiss} className="w-[640px] max-w-full">
          <div className="bg-[linear-gradient(135deg,var(--color-maroon),color-mix(in_srgb,var(--color-maroon)_78%,white))] px-[24px] pb-[26px] pt-[28px] text-center text-white sm:px-[36px]">
            <PartyPopper
              className="mx-auto h-[40px] w-[40px] animate-[success-pop_500ms_cubic-bezier(0.2,1.4,0.4,1)_120ms_both] text-yellow"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="mt-[12px] text-heading font-bold leading-tight">{visit.visitLabel} complete!</p>
            <p className="mx-auto mt-[8px] max-w-[56ch] text-regular leading-relaxed text-white/90">
              Congratulations, {visit.programLabel}.{" "}
              {visit.nextLevel
                ? `Before you move on to ${visit.nextLevel}, please answer these short evaluations.`
                : "Please answer these short evaluations."}
            </p>
          </div>

          <div className="flex flex-1 flex-col gap-[10px] overflow-y-auto px-[20px] py-[20px] sm:px-[28px]">
            {pending.map((t, i) => (
              <EvaluationTaskRow
                key={t.key}
                index={i}
                badge={evaluationBadge(t)}
                title={evaluationTitle(t)}
                meta={t.status === "draft" ? "Started, not yet submitted" : "About 3 minutes"}
                action={
                  <Button variant="primary" onClick={() => answer(t.key)}>
                    {t.status === "draft" ? "Continue" : "Answer"}
                  </Button>
                }
              />
            ))}
            <p className="mt-[4px] text-regular leading-relaxed text-black/70">
              Your answers help the QA Center improve. You can also find these anytime under{" "}
              <span className="whitespace-nowrap font-semibold text-black">Submission → Evaluations</span>.
            </p>
          </div>

          <div className="flex items-center justify-between gap-[12px] border-t border-[color:var(--hairline)] px-[20px] py-[14px] sm:px-[28px]">
            <Button variant="secondary" onClick={dismiss}>
              Remind me later
            </Button>
            <Button variant="primary" onClick={() => answer(pending[0].key)}>
              Start now
            </Button>
          </div>
        </Modal>
      )}
      {flow.modal}
    </>
  );
}
