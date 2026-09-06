import type { AssignmentDetail } from "@/lib/assignments";
import { BackLink, Card, EmptyState, PanelHeader, ReadOnlyField } from "../kit";
import AssignmentResponse from "./AssignmentResponse";

/**
 * What an Internal Accreditor sees at `/portal/evaluation/[id]` before they have
 * accepted the assignment — round 2 §1's "accept unblocks the evaluation flow",
 * made visible at the place the flow is blocked.
 *
 * It answers the invitation from here rather than sending them back to the
 * Assignment table: this is the screen where they have just read what the work
 * actually is, which is when someone decides whether to take it.
 *
 * A declined assignment shows no controls at all. Reversing a decline is QAC
 * Personnel's call — they reassign — and an Accept button here would let an
 * accreditor undo a refusal QAC has already started acting on.
 */
export default function EvaluationLocked({
  assignmentId,
  detail,
  response,
}: {
  assignmentId: string;
  detail: AssignmentDetail;
  response: "pending" | "rejected";
}) {
  return (
    <div className="px-[var(--page-gutter)] pb-[45px] pt-[45px] lg:px-[57px]">
      <Card className="px-[24px] py-[32px] sm:px-[44.5px] sm:pb-[42px] sm:pt-[47px]">
        <PanelHeader
          title="Accreditation Assignment"
          action={<BackLink href="/portal/evaluation" />}
        />

        <div className="mt-[26px] grid gap-x-[33px] gap-y-[20px] sm:grid-cols-2 lg:grid-cols-4">
          <ReadOnlyField label="Campus" value={detail.campus} />
          <ReadOnlyField label="College" value={detail.college} />
          <ReadOnlyField label="Program" value={detail.program} />
          <ReadOnlyField label="Level" value={detail.level} />
        </div>

        <div className="mt-[32px]">
          {response === "pending" ? (
            <EmptyState
              variant="locked"
              title="Accept this assignment to open its evaluation sheet"
              description="The sheet stays closed until you answer. Declining sends the assignment back to QAC Personnel, who will reassign it."
            >
              <span className="flex items-center justify-center gap-[16px]">
                <AssignmentResponse assignmentId={assignmentId} variant="confirm-accept" />
                <AssignmentResponse assignmentId={assignmentId} variant="decline-button" />
              </span>
            </EmptyState>
          ) : (
            <EmptyState
              variant="locked"
              title="You declined this assignment"
              description="It is back with QAC Personnel. If they put you on it again, it reappears on your Assignment screen as a new invitation."
              action={{ label: "Back to Evaluation", href: "/portal/evaluation" }}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
