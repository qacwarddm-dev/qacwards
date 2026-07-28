export type DocStatus = "pending" | "approved" | "disapproved";

const FILL: Record<DocStatus, string> = {
  pending: "bg-yellow",
  approved: "bg-[color:var(--color-approved)]",
  disapproved: "bg-maroon",
};

const LABEL: Record<DocStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  disapproved: "Disapproved",
};

/**
 * Document review state. The label is derived from the status rather than
 * passed in, so a screen cannot ship a pill whose colour and wording disagree —
 * and the eventual real-data swap sends a status, not a caption.
 */
export default function StatusPill({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex h-[20px] items-center justify-center rounded-[5px] px-[7px] text-small leading-none text-white ${FILL[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}
