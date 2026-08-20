"use client";

import { useState } from "react";
import Button from "./Button";
import Dialog from "./Dialog";
import { TextareaField } from "./Field";

/**
 * Preset over `Dialog` for destructive or consequential actions — accept/
 * decline on assignments, closing a cycle, detaching a rep. Always names its
 * object in `description` (09b §8: "Close cycle", not "Confirm") and, when
 * `requireReason` is set, blocks the confirm button until a reason is typed
 * (the accreditor decline flow, which today has no reason field at all).
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "default",
  requireReason = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  tone?: "danger" | "default";
  requireReason?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const blocked = requireReason && reason.trim().length === 0;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            loading={busy}
            disabled={blocked}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="t-body text-black">{description}</div>
      {requireReason && (
        <div className="mt-[16px]">
          <TextareaField
            label="Reason"
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      )}
    </Dialog>
  );
}
