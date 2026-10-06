"use client";

import type { ArchiveEntry, ArchiveIssue } from "@/lib/archive-model";
import { shortDate } from "@/lib/program-names";
import Btn from "./Btn";
import Modal from "./Modal";
import PdfFrame from "./PdfFrame";

const src = (id: string) => `/api/documents/download?source=submission&id=${id}#toolbar=0&navpanes=0`;

export default function ArchiveCompare({ entry, issue, own, onClose }: { entry: ArchiveEntry; issue: ArchiveIssue; own?: boolean; onClose: () => void }) {
  return (
    <Modal
      size="wide"
      title={`${issue.area} · v1 and v${issue.version}`}
      sub={`${entry.short} · ${entry.cycle} · view only`}
      onClose={onClose}
      footer={<Btn variant="s" onClick={onClose}>Close</Btn>}
    >
      <div className="arch-cmp">
        <div>
          <div className="arch-cmph bad">
            v1 · returned
            <small>
              {issue.flaggedBy}: “{issue.flag}”
            </small>
          </div>
          <div className="vwrap" style={{ height: "60vh" }} onContextMenu={(e) => e.preventDefault()}>
            <PdfFrame src={src(issue.firstDocId)} title="First version" />
          </div>
        </div>
        <div>
          <div className="arch-cmph ok">
            v{issue.version} · accepted {shortDate(issue.resolvedAt)}
            <small>
              {own ? "Your change note" : "Change note"}: “{issue.change}”
            </small>
          </div>
          <div className="vwrap" style={{ height: "60vh" }} onContextMenu={(e) => e.preventDefault()}>
            <PdfFrame src={src(issue.finalDocId)} title="Accepted version" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
