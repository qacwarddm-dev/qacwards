import { Check, EllipsisVertical, X } from "lucide-react";
import Link from "next/link";
import { type Column, Button, DataTable, EmptyState, Modal, Panel } from "../kit";
import AssignmentResponse from "./AssignmentResponse";

/**
 * Internal Accreditor → Assignment —
 * assets/FIGMA/internal_accreditor/02-Accreditation.png, plus the Accept
 * Confirmation dialog from 02.1-Accept-Modal.png. The accept square is a
 * `Link` to `?confirm=<row id>` rather than a client-side handler — `Modal`'s
 * open/close state is the URL, matching every other overlay in the kit.
 *
 * A single-panel table: the same grey-headed `DataTable` the QAC Personnel
 * Assignment screen uses, but with an accept/reject Action column and a Status
 * column instead of the accreditor/score pair. Outer padding 50/54/52 and the
 * 41px `Panel` shell are measured off the frame.
 *
 * Wired in B5. Rows come from `getAssignments()`, scoped by RLS to the
 * assignments this accreditor is actually on. Accept and decline are real writes
 * (`AssignmentResponse`), and an accreditor can only answer their own invitation
 * — the policy keys on `profile_id = auth.uid()`, so one team member cannot
 * accept on another's behalf.
 */
export type AssignmentListRow = {
  id: string;
  campus: string;
  college: string;
  program: string;
  level: string;
  status: string;
  myResponse: string | null;
};
const COLUMNS: Column[] = [
  { key: "campus", header: "Campus", width: "w-[175px]" },
  { key: "college", header: "College", width: "w-[150px]" },
  { key: "program", header: "Program", width: "flex-1" },
  { key: "level", header: "Level", width: "w-[110px]" },
  { key: "action", header: "Action", width: "w-[130px]" },
  { key: "status", header: "Status", width: "w-[150px]" },
];

/** Small filled square holding a glyph — the accept (yellow) / reject (pink)
 *  affordance. The frame draws the reject square at half strength. Accept
 *  opens the Accept Confirmation modal; reject has no matching frame yet. */
function ActionSquare({ tone, confirmHref }: { tone: "accept" | "reject"; confirmHref?: string }) {
  const accept = tone === "accept";
  const cls = `flex h-[24px] w-[24px] items-center justify-center rounded-[6px] ${
    accept ? "bg-yellow" : "bg-[color:var(--color-maroon)]/25"
  }`;
  const icon = accept ? (
    <Check className="h-[16px] w-[16px] text-white" strokeWidth={3} aria-hidden />
  ) : (
    <X className="h-[16px] w-[16px] text-white" strokeWidth={3} aria-hidden />
  );

  if (confirmHref) {
    return (
      <Link href={confirmHref} aria-label="Accept assignment" className={cls}>
        {icon}
      </Link>
    );
  }
  return <span className={cls}>{icon}</span>;
}

export default function InternalAccreditorAssignment({
  confirm,
  assignments,
}: {
  confirm?: string;
  assignments: AssignmentListRow[];
}) {
  const rows = assignments.map((a) => ({
    id: a.id,
    cells: {
      campus: a.campus,
      college: a.college,
      program: <span className="block truncate">{a.program}</span>,
      level: a.level,
      action:
        a.myResponse === "pending" ? (
          <span className="flex items-center justify-center gap-[10px]">
            <ActionSquare tone="accept" confirmHref={`/portal/assignment?confirm=${a.id}`} />
            <AssignmentResponse assignmentId={a.id} />
          </span>
        ) : (
          <span className="flex items-center justify-center text-regular italic text-gray">
            {a.myResponse === "accepted" ? "Accepted" : "Declined"}
          </span>
        ),
      status: (
        <span className="flex items-center justify-center gap-[16px]">
          <span className="italic text-gray">{a.status}</span>
          <EllipsisVertical
            className="h-[18px] w-[18px] text-black"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      ),
    },
  }));

  return (
    <div className="pb-[50px] pl-[54px] pr-[52px] pt-[50px]">
      <Panel title="Accreditation Assignment">
        {assignments.length > 0 ? (
          <DataTable columns={COLUMNS} rows={rows} />
        ) : (
          <EmptyState message="You have no assignments yet." />
        )}
      </Panel>

      {confirm &&
        assignments.some((a) => a.id === confirm && a.myResponse === "pending") && (
          <Modal title="Accept Confirmation" className="w-[350px]">
            <p className="text-center text-regular leading-[18px] text-gray">
              Are you sure you want to accept this assignment?
            </p>
            <div className="mt-[24px] flex justify-center gap-[16px]">
              <Button variant="ghost" href="/portal/assignment">
                Cancel
              </Button>
              <AssignmentResponse assignmentId={confirm} variant="confirm-accept" />
            </div>
          </Modal>
        )}
    </div>
  );
}
