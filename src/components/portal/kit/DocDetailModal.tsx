"use client";

import Btn from "./Btn";
import { useDocUrl, pdfSrc } from "./DocViewer";
import { Thread } from "./History";
import Modal from "./Modal";
import PdfFrame from "./PdfFrame";
import { DocPill } from "./Pill";
import Spinner from "./Spinner";
import SumRows from "./SumRows";
import { useToast } from "./ToastProvider";
import type { Slot } from "@/lib/review-model";

/** The representative's own document: preview, facts, the reviewer thread. */
export default function DocDetailModal({
  slot,
  sub,
  onClose,
  onResubmit,
  onReplace,
}: {
  slot: Slot;
  sub: string;
  onClose: () => void;
  onResubmit?: () => void;
  onReplace?: () => void;
}) {
  const { url, error } = useDocUrl(slot.docId);
  const toast = useToast();
  return (
    <Modal
      size="wide"
      title={slot.name}
      sub={sub}
      onClose={onClose}
      footer={
        <>
          {slot.docId && (
            <Btn variant="o" href={`/api/documents/download?source=submission&id=${slot.docId}&download=1`} download={slot.file ?? "document.pdf"} onClick={() => toast.say(`Downloading ${slot.file}`)}>
              ⬇ Download
            </Btn>
          )}
          {slot.state === "returned" && onResubmit && <Btn onClick={onResubmit}>↺ Resubmit</Btn>}
          {slot.state === "pending" && onReplace && (
            <Btn variant="gh" onClick={onReplace}>
              Replace file
            </Btn>
          )}
          <Btn variant="gh" onClick={onClose}>
            Close
          </Btn>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 18 }}>
        <div style={{ background: "#e9e9e9", borderRadius: 12, padding: 10, height: 260, position: "relative" }}>
          {url ? <PdfFrame src={pdfSrc(url)} title={slot.name} style={{ boxShadow: "0 2px 8px rgba(0,0,0,.15)" }} /> : error ? <span style={{ color: "#999", fontSize: 13 }}>{error}</span> : <Spinner label="Loading document…" />}
        </div>
        <div>
          <SumRows
            flush
            rows={[
              ["Status", <DocPill key="s" state={slot.state} />],
              ["File", slot.file ?? "—"],
              ["Uploaded", `${slot.date ?? "—"} by ${slot.by ?? "—"}`],
              ["Version", `v${slot.version || 1}`],
            ]}
          />
          {slot.history.length ? (
            <Thread items={slot.history} />
          ) : (
            <p className="sub" style={{ marginTop: 12 }}>
              No comments yet.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
