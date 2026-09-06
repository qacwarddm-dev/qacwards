"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "../kit";
import { respondToAssignment } from "@/lib/assignment-actions";

/**
 * Accept or decline an assignment invitation.
 *
 * Three shapes, one component, because they are the same write: the small reject
 * square in the table's Action column, the Accept button inside the confirmation
 * modal, and the accept/decline pair on a locked evaluation sheet. Splitting them
 * would mean call sites drifting apart on what "decline" does.
 *
 * Declining asks for a reason — `assignment_accreditors.rejection_note` exists so
 * QAC can see why a team member stepped back, and an empty note makes the column
 * decorative.
 */
export default function AssignmentResponse({
  assignmentId,
  variant = "reject-square",
  afterRespond,
}: {
  assignmentId: string;
  variant?: "reject-square" | "confirm-accept" | "decline-button";
  /** Where to go once the answer lands. Omitted, the current route re-renders
   *  in place — right for a screen that becomes the evaluation sheet on accept,
   *  wrong for the Accept Confirmation modal, whose open state IS the URL and
   *  which therefore has to navigate to close. */
  afterRespond?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function respond(response: "accepted" | "rejected", rejectionNote?: string) {
    setError(null);
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await respondToAssignment(assignmentId, response, rejectionNote);
        if (!result.ok) {
          setError(result.error);
        } else {
          setAsking(false);
          if (afterRespond) router.push(afterRespond);
          else router.refresh();
        }
        resolve();
      });
    });
  }

  if (variant === "confirm-accept") {
    return (
      <div className="flex flex-col items-center">
        <Button
          variant="solid"
          disabled={pending}
          onClick={() => respond("accepted")}
        >
          {pending ? "Accepting…" : "Accept"}
        </Button>
        {error && (
          <p className="mt-[8px] text-regular leading-tight text-maroon">{error}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {variant === "decline-button" ? (
        <Button variant="danger" disabled={pending} onClick={() => setAsking(true)}>
          Decline
        </Button>
      ) : (
        <button
          type="button"
          aria-label="Decline assignment"
          onClick={() => setAsking(true)}
          className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-[color:var(--color-maroon)]/25"
        >
          <X className="h-[16px] w-[16px] text-white" strokeWidth={3} aria-hidden />
        </button>
      )}
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="Decline this assignment"
        description="QAC Personnel will see your reason. This cannot be undone from here — an assignment you decline has to be reassigned."
        confirmLabel="Decline assignment"
        tone="danger"
        requireReason
        onConfirm={(reason) => respond("rejected", reason)}
      />
      {error && <p className="mt-[8px] text-regular leading-tight text-maroon">{error}</p>}
    </>
  );
}
