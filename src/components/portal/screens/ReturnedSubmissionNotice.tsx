"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { SubmissionReturn } from "@/lib/assignments";
import { formatLongDate } from "@/lib/evaluation-sheet";
import { submitForEvaluation } from "@/lib/submission-actions";
import { Alert, Button, useToast } from "../kit";

/** What the rep sees after an Internal Accreditor clicks Return: the note, and
 *  the one action that sends the fixed submission back to the same team. */
export default function ReturnedSubmissionNotice({
  submissionId,
  levelLabel,
  returned,
}: {
  submissionId: string;
  levelLabel: string;
  returned: SubmissionReturn;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  function resubmit() {
    startTransition(async () => {
      const result = await submitForEvaluation(submissionId);
      if (!result.ok) {
        toast.push({ tone: "error", title: result.error });
        return;
      }
      toast.push({ tone: "success", title: "Resubmitted to your accreditors." });
      router.refresh();
    });
  }

  return (
    <div className="px-[54px] pt-[30px]">
      <Alert tone="warning" title={`${levelLabel} was returned by your Internal Accreditor`}>
        <p>
          &ldquo;{returned.note}&rdquo; — {returned.returnedBy}, {formatLongDate(returned.createdAt)}
        </p>
        <div className="mt-[12px]">
          <Button variant="primary" onClick={resubmit} loading={pending}>
            Resubmit
          </Button>
        </div>
      </Alert>
    </div>
  );
}
