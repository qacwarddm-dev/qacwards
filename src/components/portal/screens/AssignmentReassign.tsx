"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EligibleAccreditor } from "@/lib/assignments";
import {
  fetchEligibleAccreditorsForAssignment,
  reassignAssignment,
} from "@/lib/assignment-actions";
import { AccreditorPicker, Button, Dialog, Spinner } from "../kit";

/**
 * QAC Personnel puts a new team on an assignment its accreditors declined —
 * round 2 §1's "back to the QAC Personnel queue", where the queue is the
 * Accreditation Assignment table itself and this is the action on the row.
 *
 * Reassignment is manual by decision, not by omission: the client's note says
 * QAC Personnel reassigns, so nothing here auto-picks a replacement. The
 * decline reasons are printed above the picker because they are the whole basis
 * for choosing differently — a list of names with no reason would make QAC open
 * their notifications to find out why.
 *
 * The eligible list is fetched when the dialog opens rather than with the page:
 * every row on the table would otherwise pay for a list only the reassigned row
 * ever shows.
 */
export default function AssignmentReassign({
  assignmentId,
  declined,
}: {
  assignmentId: string;
  declined: { name: string; note: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accreditors, setAccreditors] = useState<EligibleAccreditor[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchEligibleAccreditorsForAssignment(assignmentId).then((rows) => {
      if (!cancelled) setAccreditors(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [open, assignmentId]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await reassignAssignment(assignmentId, [...selected]);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setSelected(new Set());
      setAccreditors(null);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" size="md" onClick={() => setOpen(true)}>
        Reassign
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        title="Reassign this assignment"
        description="The accreditors you pick replace the current team. They are invited again and answer for themselves."
        size="lg"
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              disabled={pending || selected.size !== 2}
              onClick={submit}
            >
              {pending ? "Reassigning…" : "Reassign"}
            </Button>
          </>
        }
      >
        {declined.length > 0 && (
          <div className="mb-[20px] rounded-[var(--radius-md)] bg-[color:var(--color-gray)]/5 px-[16px] py-[12px]">
            <h3 className="t-sm font-semibold text-black">Why the team stepped back</h3>
            <ul className="mt-[8px] flex flex-col gap-[6px]">
              {declined.map((d) => (
                <li key={d.name} className="t-sm text-gray">
                  <span className="text-black">{d.name}</span>
                  {d.note ? ` — ${d.note}` : " — no reason given"}
                </li>
              ))}
            </ul>
          </div>
        )}

        {accreditors === null ? (
          <div className="flex justify-center py-[24px]">
            <Spinner />
          </div>
        ) : (
          <>
            <p className="mb-[10px] t-sm leading-tight text-black/70">
              Select exactly 2 ({selected.size}/2 selected).
            </p>
            <AccreditorPicker
            accreditors={accreditors}
            selected={selected}
            onToggle={toggle}
            disabled={pending}
            emptyMessage="No other accreditor is available for this programme."
          />
          </>
        )}

        {error && <p className="mt-[16px] t-sm leading-tight text-maroon">{error}</p>}
      </Dialog>
    </>
  );
}
