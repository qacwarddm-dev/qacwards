"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssignmentRequirements, SubmissionReturn } from "@/lib/assignments";
import type { Stat } from "@/components/portal/kit";
import { markReadyForSurveyVisit, returnSubmission } from "@/lib/assignment-actions";
import { formatLongDate, isEvaluationOpen } from "@/lib/evaluation-sheet";
import {
  Alert,
  Breadcrumb,
  Button,
  ConfirmModal,
  EvaluationSummary,
  Modal,
  Panel,
  ProgressRow,
  RowList,
  TextInput,
  useToast,
} from "../kit";
import SurveyInstrumentModal from "./SurveyInstrumentModal";

type Dialog = "reject" | "note" | "approve" | "unavailable" | "instrument" | null;

export default function InternalAccreditorRequirements({
  assignmentId,
  stats,
  data,
  lastReturn,
  visitAddress,
  visitDate,
}: {
  assignmentId: string;
  stats: Stat[];
  data: AssignmentRequirements;
  lastReturn: SubmissionReturn | null;
  visitAddress: string;
  visitDate: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState("");
  const { detail, areas, readiness } = data;

  const reviewing = detail.status === "in_progress";
  const returned = reviewing && detail.submissionStatus === "returned";
  const approved = detail.status === "for_psv";
  const done = detail.status === "evaluated" || detail.status === "score_returned";
  const evaluationOpen = isEvaluationOpen(detail.siteVisitDate);

  function run(action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.push({ tone: "error", title: result.error });
        return;
      }
      setDialog(null);
      setNote("");
      toast.push({ tone: "success", title: success });
      router.refresh();
    });
  }

  const half = Math.ceil(areas.length / 2);
  const columns = [areas.slice(0, half), areas.slice(half)];

  let footer: React.ReactNode;
  if (done) {
    footer = (
      <span className="flex gap-[16px]">
        <Button variant="secondary" size="lg" href={`/portal/evaluation/${assignmentId}/sheet`}>
          View Sheet
        </Button>
        <Button variant="primary" size="lg" href={`/api/evaluations/${assignmentId}/sheet`}>
          Download PDF
        </Button>
      </span>
    );
  } else if (approved) {
    footer = (
      <Button
        variant={evaluationOpen ? "primary" : "muted"}
        size="lg"
        onClick={() => setDialog(evaluationOpen ? "instrument" : "unavailable")}
      >
        Evaluate
      </Button>
    );
  } else {
    footer = (
      <span className="flex gap-[16px]">
        <Button
          variant="secondary"
          size="lg"
          disabled={!reviewing || returned}
          onClick={() => setDialog("reject")}
        >
          Return
        </Button>
        <Button
          variant="primary"
          size="lg"
          disabled={!reviewing || returned}
          onClick={() => setDialog("approve")}
        >
          Approve
        </Button>
      </span>
    );
  }

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <EvaluationSummary stats={stats} />

      <div className="mb-[14px] mt-[26px] pl-[4px]">
        <Breadcrumb
          items={[{ label: "Programs", href: "/portal/evaluation" }, { label: "Requirements" }]}
          variant="trail"
        />
      </div>

      {returned && lastReturn && (
        <div className="mb-[16px]">
          <Alert tone="warning" title="Returned to the program — waiting for resubmission">
            “{lastReturn.note}” — {lastReturn.returnedBy},{" "}
            {formatLongDate(lastReturn.createdAt)}
          </Alert>
        </div>
      )}

      <Panel
        title="Accreditation Requirements"
        action={
          reviewing ? (
            <span className="flex items-center gap-[10px]">
              <span className="h-[8px] w-[140px] shrink-0 rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-yellow"
                  style={{ width: `${readiness}%` }}
                />
              </span>
              <span className="text-subheading font-semibold leading-none text-black">
                {readiness}%
              </span>
            </span>
          ) : undefined
        }
        back={{ href: "/portal/evaluation", to: "Programs" }}
        footer={footer}
      >
        <div className="flex gap-[24px]">
          {columns.map((col, i) => (
            <div key={i} className="flex-1">
              <RowList>
                {col.map((area) => (
                  <ProgressRow
                    key={area.id}
                    label={area.isOptional ? `${area.name} (optional)` : area.name}
                    marker={false}
                    href={`/portal/evaluation/${assignmentId}?area=${area.id}`}
                  />
                ))}
              </RowList>
            </div>
          ))}
        </div>
      </Panel>

      {dialog === "reject" && (
        <ConfirmModal
          title="Reject Confirmation"
          message="Are you sure you want to reject this document?"
          confirmLabel="Reject"
          onCancel={() => setDialog(null)}
          onConfirm={() => setDialog("note")}
        />
      )}

      {dialog === "note" && (
        <Modal title="Return Note" titleAlign="start" className="w-[560px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => returnSubmission(assignmentId, note), "Returned to the program.");
            }}
          >
            <TextInput
              label="Return note"
              placeholder="Fix Area I"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <div className="mt-[24px] flex justify-end gap-[16px]">
              <Button variant="ghost" onClick={() => setDialog(null)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending} disabled={!note.trim()}>
                Send
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "approve" && (
        <ConfirmModal
          title="Approve Confirmation"
          message="Are you sure you want to approve this program's documents for the site visit?"
          confirmLabel="Approve"
          busy={pending}
          onCancel={() => setDialog(null)}
          onConfirm={() => run(() => markReadyForSurveyVisit(assignmentId), "Approved for site visit.")}
        />
      )}

      {dialog === "unavailable" && (
        <Modal
          title="Evaluation Not Yet Available"
          titleAlign="center"
          onClose={() => setDialog(null)}
          className="w-[400px]"
        >
          <p className="text-center text-regular leading-[18px] text-black">
            The evaluation can only be conducted on the scheduled Site Visit date.{" "}
            {detail.siteVisitDate ? (
              <>
                The &ldquo;Evaluate&rdquo; button will be available on{" "}
                <strong>{formatLongDate(detail.siteVisitDate)}</strong>.
              </>
            ) : (
              <>QAC has not scheduled the Site Visit for this program yet.</>
            )}
          </p>
        </Modal>
      )}

      {dialog === "instrument" && (
        <SurveyInstrumentModal
          assignmentId={assignmentId}
          detail={detail}
          initialAddress={visitAddress}
          initialVisitDate={visitDate}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
