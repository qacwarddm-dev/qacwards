"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SurveyFormModal } from "../kit";
import { saveVisitEvaluation } from "@/lib/visit-evaluation-actions";
import { SURVEY_FORMS, initialAnswers } from "@/lib/visit-evaluation-forms";
import type { CompletedVisit, EvaluationTarget } from "@/lib/visit-evaluations";

export function evaluationTitle(t: EvaluationTarget) {
  return t.kind === "qac_service"
    ? SURVEY_FORMS.qac_service.title
    : `${SURVEY_FORMS.internal_accreditor.title} · ${t.who}`;
}

export function evaluationBadge(t: EvaluationTarget) {
  return t.kind === "qac_service" ? "QAC" : "IA";
}

export function outstanding(visit: CompletedVisit) {
  return visit.targets.filter((t) => t.status !== "submitted");
}

export function useVisitEvaluationFlow(visits: CompletedVisit[]) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, Partial<EvaluationTarget>>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);

  const merged = visits.map((v) => ({
    ...v,
    targets: v.targets.map((t) => ({ ...t, ...local[t.key] })),
  }));

  const visit = merged.find((v) => v.targets.some((t) => t.key === openKey));
  const target = visit?.targets.find((t) => t.key === openKey);

  const modal =
    visit && target ? (
      <SurveyFormModal
        key={target.key}
        form={SURVEY_FORMS[target.kind]}
        who={target.kind === "internal_accreditor" ? target.who : null}
        visitLabel={visit.visitLabel}
        auto={{ ...visit.auto, accreditor: target.who }}
        initial={initialAnswers(SURVEY_FORMS[target.kind], visit.visitLabel, target.answers)}
        submittedAt={target.submittedAt}
        remainingAfter={outstanding(visit).filter((t) => t.key !== target.key).length}
        onSave={async (answers, submit) => {
          const res = await saveVisitEvaluation({
            assignmentId: target.assignmentId,
            kind: target.kind,
            accreditorId: target.accreditorId,
            answers,
            submit,
          });
          if (res.ok) {
            setLocal((prev) => ({
              ...prev,
              [target.key]: {
                answers,
                status: submit ? "submitted" : "draft",
                submittedAt: res.submittedAt,
              },
            }));
          }
          return res;
        }}
        onClose={() => {
          setOpenKey(null);
          router.refresh();
        }}
        onNext={() => {
          const next = outstanding(visit).find((t) => t.key !== target.key);
          if (next) setOpenKey(next.key);
        }}
      />
    ) : null;

  return { visits: merged, open: setOpenKey, modal };
}
