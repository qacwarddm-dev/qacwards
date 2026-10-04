"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import useBusy from "./useBusy";
import ActLink from "./ActLink";
import Btn from "./Btn";
import DocViewer from "./DocViewer";
import Modal from "./Modal";
import { ReviewChip } from "./Pill";
import { useToast } from "./ToastProvider";
import type { Slot } from "@/lib/review-model";
import { reviewDocument } from "@/lib/review-actions";

export function useReviewActions() {
  const [pending, start] = useBusy();
  const toast = useToast();
  const router = useRouter();
  function decide(slot: Slot, decision: "approved" | "returned" | "undone", note?: string, done?: () => void) {
    if (!slot.docId) return;
    if (decision === "returned" && !note?.trim()) return toast.say("Add a remark first so the program knows what to fix", true);
    return start(async () => {
      const r = await reviewDocument(slot.docId!, decision, note);
      if (!r.ok) return toast.say(r.error, true);
      toast.say(decision === "approved" ? `${slot.name} approved` : decision === "returned" ? "Returned to the program with your remark" : "Decision undone");
      done?.();
      router.refresh();
    });
  }
  return { decide, pending };
}

export function ReviewDocModal({
  slot,
  sub,
  startReturn,
  locked,
  meId,
  allowUndo,
  onClose,
  onFull,
}: {
  slot: Slot;
  sub: string;
  startReturn?: boolean;
  locked: boolean;
  meId: string;
  allowUndo?: boolean;
  onClose: () => void;
  onFull: () => void;
}) {
  const [ret, setRet] = useState(Boolean(startReturn));
  const [note, setNote] = useState("");
  const { decide, pending } = useReviewActions();
  const canDecide = !locked && slot.state === "pending";
  return (
    <Modal
      onClose={onClose}
      title={slot.name}
      sub={sub}
      footer={
        canDecide ? (
          <>
            <Btn variant="o" onClick={onClose}>
              Cancel
            </Btn>
            <Btn
              variant="d"
              disabled={pending}
              onClick={() => {
                if (!ret) return setRet(true);
                return decide(slot, "returned", note, onClose);
              }}
            >
              ↺ {ret ? "Send return" : "Return for revision"}
            </Btn>
            {!startReturn && (
              <Btn variant="g" disabled={pending} onClick={() => decide(slot, "approved", undefined, onClose)}>
                ✓ Approve
              </Btn>
            )}
          </>
        ) : (
          <>
            {allowUndo && !locked && slot.state === "approved" && (
              <Btn variant="gh" disabled={pending} onClick={() => decide(slot, "undone", undefined, onClose)}>
                Undo approval
              </Btn>
            )}
            <Btn variant={allowUndo ? "s" : "o"} onClick={onClose}>
              Close
            </Btn>
          </>
        )
      }
    >
      {!startReturn && (
        <>
          <DocViewer docId={slot.docId} onFullscreen={onFull} />
          <div className="dmeta">
            <span>📄 {slot.file}</span>
            <span>{slot.size}</span>
            <span>
              Uploaded {slot.date} by {slot.by ?? "the program"}
            </span>
            <ReviewChip state={slot.state} />
          </div>
          <div style={{ fontSize: 11.5, color: "#999", marginTop: 6 }}>View only. Program files can’t be downloaded from here.</div>
        </>
      )}
      {slot.state === "returned" && slot.returnNote && (
        <div className="rem" style={{ marginTop: 12, background: "var(--red-soft,#fdecec)", color: "#8f1d1d", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
          ↺ <b>{slot.returnedById === meId ? "Your" : `${slot.returnedBy ?? "Reviewer"}’s`} remark:</b> {slot.returnNote}
        </div>
      )}
      {ret && (
        <div className="retf">
          <label>What should the program fix? *</label>
          <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Page 3 is missing the dean’s signature." />
          <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>The program representative sees this on their Feedback page and resubmits.</div>
        </div>
      )}
    </Modal>
  );
}

export function ReviewDecision({ slot, locked }: { slot: Slot; locked: boolean }) {
  const [ret, setRet] = useState(false);
  const [note, setNote] = useState("");
  const { decide, pending } = useReviewActions();
  return (
    <>
      {slot.state === "approved" ? (
        <div className="decb ok">
          <span>
            ✓ <b>Document approved.</b>
          </span>
          {!locked && (
            <ActLink onClick={() => decide(slot, "undone")}>Undo</ActLink>
          )}
        </div>
      ) : slot.state === "returned" ? (
        <div className="decb ret">
          <span>
            ↺ <b>Returned for revision.</b>
            <br />
            <span style={{ fontSize: 12 }}>{slot.returnNote}</span>
          </span>
        </div>
      ) : locked ? null : (
        <div className="decb">
          <span>
            <b>Is this document complete?</b>
          </span>
          {ret && (
            <div className="retf" style={{ width: "100%" }}>
              <label>What should the program fix? *</label>
              <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Page 3 is missing the dean’s signature." />
            </div>
          )}
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn variant="d" sm disabled={pending} onClick={() => (ret ? decide(slot, "returned", note) : setRet(true))}>
              ↺ {ret ? "Send return" : "Return for revision"}
            </Btn>
            <Btn variant="g" sm disabled={pending} onClick={() => decide(slot, "approved")}>
              ✓ Approve
            </Btn>
          </span>
        </div>
      )}
    </>
  );
}
