import { Link2, FileText } from "lucide-react";
import StatusPill, { type DocStatus } from "./StatusPill";

export type Upload = {
  id: string;
  title: string;
  /** Person who uploaded it — the row renders the "Uploaded by" wording. */
  uploadedBy: string;
  /** Pre-formatted for now; becomes a timestamp when the backend lands. */
  when: string;
  status: DocStatus;
  /** A link-shaped upload draws the chain glyph instead of the document one. */
  kind?: "file" | "link";
};

/**
 * "Recent Uploads" list. Rows are a fixed 68px so the card can clip mid-row —
 * the frame deliberately cuts its fourth row off at the card's bottom edge to
 * signal that the list continues behind "View All".
 */
export default function UploadList({ uploads }: { uploads: Upload[] }) {
  return (
    <ul>
      {uploads.map((u) => {
        const Icon = u.kind === "link" ? Link2 : FileText;

        return (
          <li
            key={u.id}
            className="flex h-[68px] items-center border-t border-[color:var(--color-gray)]/20 px-[24px]"
          >
            <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-maroon">
              <Icon className="h-[19px] w-[19px] text-white" strokeWidth={2} aria-hidden />
            </span>

            <span className="ml-[15px] flex min-w-0 flex-col">
              <span className="truncate text-regular leading-[16px] text-black">
                {u.title}
              </span>
              <span className="truncate text-regular leading-[16px] text-gray">
                Uploaded by {u.uploadedBy}
              </span>
              <span className="truncate text-micro leading-[14px] text-[color:var(--color-gray)]/70">
                {u.when}
              </span>
            </span>

            <span className="ml-auto pl-[12px]">
              <StatusPill status={u.status} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
