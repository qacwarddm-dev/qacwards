import type { AreaDocument } from "@/lib/assignments";
import { EmptyState, FileList, formatFileSize, Modal } from "../kit";

export default function AreaDocumentsModal({
  areaName,
  program,
  documents,
  closeHref,
}: {
  areaName: string;
  program: string;
  documents: AreaDocument[];
  closeHref: string;
}) {
  return (
    <Modal title={areaName} closeHref={closeHref} className="w-full max-w-[860px]">
      <p className="mb-[16px] text-regular text-gray">Files submitted by {program}</p>
      {documents.length > 0 ? (
        <FileList
          entries={documents.map((d) => {
            const href = `/api/documents/download?source=submission&id=${d.id}`;
            return {
              id: d.id,
              kind: "file" as const,
              name: d.version > 1 ? `${d.title} (v${d.version})` : d.title,
              owner: d.uploadedBy,
              modified: new Date(d.uploadedAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "Asia/Manila",
              }),
              size: formatFileSize(d.fileSize),
              href,
              menu: [
                { label: "Open", href },
                { label: "Download", href: `${href}&download=1` },
              ],
            };
          })}
        />
      ) : (
        <EmptyState message="The program has not uploaded anything for this area yet." />
      )}
    </Modal>
  );
}
