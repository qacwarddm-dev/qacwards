"use client";

import Button from "./Button";
import Modal from "./Modal";

/** The centered yes/no card from docs/internal_accreditor.pdf ("Reject
 *  Confirmation") — same shell as the Accept Confirmation frame. */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  busy = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} className="w-[380px]">
      <p className="text-center text-regular leading-[18px] text-gray">{message}</p>
      <div className="mt-[24px] flex justify-center gap-[16px]">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
