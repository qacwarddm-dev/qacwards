"use client";

import { BackLink, Button, Card, EmptyState, EvaluationTaskRow, type StatusKey } from "../kit";
import type { CompletedVisit, EvaluationTarget } from "@/lib/visit-evaluations";
import {
  evaluationBadge,
  evaluationTitle,
  outstanding,
  useVisitEvaluationFlow,
} from "./useVisitEvaluationFlow";

const STATUS_PILL: Record<EvaluationTarget["status"], StatusKey> = {
  pending: "pending",
  draft: "draft",
  submitted: "answered",
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export default function ProgramRepEvaluations({ visits }: { visits: CompletedVisit[] }) {
  const flow = useVisitEvaluationFlow(visits);

  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[30px] lg:px-[57px]">
      <BackLink href="/portal/submission" to="Submission" />
      <Card className="mt-[16px] px-[20px] py-[28px] sm:px-[40px] sm:py-[36px]">
        <h1 className="text-heading font-bold leading-none text-black">Evaluations</h1>
        <p className="mt-[10px] max-w-[68ch] text-regular leading-relaxed text-black/70">
          After each accreditation visit, rate the QA Center&apos;s service and each internal
          accreditor who visited your program.
        </p>

        {flow.visits.length === 0 ? (
          <div className="mt-[28px]">
            <EmptyState
              title="No evaluations yet"
              description="They open here once your Preliminary Survey Visit is complete."
            />
          </div>
        ) : (
          flow.visits.map((visit) => {
            const left = outstanding(visit).length;
            return (
              <section key={visit.assignmentId} className="mt-[28px]">
                <div className="flex flex-wrap items-baseline justify-between gap-x-[16px] gap-y-[4px]">
                  <h2 className="text-subheading font-bold text-black">
                    {visit.programLabel}
                    <span className="ml-[8px] font-normal text-black/70">{visit.visitLabel}</span>
                  </h2>
                  <p className="text-regular text-black/70">
                    {left === 0
                      ? "All submitted. Thank you!"
                      : `${visit.targets.length - left} of ${visit.targets.length} submitted`}
                  </p>
                </div>
                <div className="mt-[12px] flex flex-col gap-[10px]">
                  {visit.targets.map((t, i) => (
                    <EvaluationTaskRow
                      key={t.key}
                      index={i}
                      badge={evaluationBadge(t)}
                      title={evaluationTitle(t)}
                      done={t.status === "submitted"}
                      meta={
                        t.submittedAt
                          ? `Submitted ${shortDate(t.submittedAt)}`
                          : t.status === "draft"
                            ? "Started, not yet submitted"
                            : "Not yet answered"
                      }
                      status={STATUS_PILL[t.status]}
                      action={
                        <Button
                          variant={t.status === "submitted" ? "secondary" : "primary"}
                          onClick={() => flow.open(t.key)}
                        >
                          {t.status === "submitted" ? "View" : t.status === "draft" ? "Continue" : "Answer"}
                        </Button>
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </Card>
      {flow.modal}
    </div>
  );
}
