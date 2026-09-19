import { STATUS, TONE_FILL, TONE_TEXT, type StatusKey } from "./status";

/** @deprecated use `StatusKey` — kept so existing imports of `DocStatus` keep compiling. */
export type DocStatus = "pending" | "approved" | "disapproved";

const SIZE = {
  sm: "h-[18px] px-[8px] text-micro",
  md: "h-[20px] px-[7px] text-small",
} as const;

/**
 * Any workflow status, driven by the single registry in `./status.ts` (09b
 * §9) — document review, submission, assignment, cycle, account and NDA
 * states all render through here so a screen cannot ship a pill whose colour
 * and wording disagree, and the label cannot drift from the status key.
 * `dotOnly` drops the text for dense tables while keeping the same tone.
 */
export default function StatusPill({
  status,
  size = "md",
  dotOnly = false,
}: {
  status: StatusKey;
  size?: "sm" | "md";
  dotOnly?: boolean;
}) {
  const entry = STATUS[status];
  const fill = TONE_FILL[entry.tone];

  if (dotOnly) {
    return (
      <span
        className={`inline-block h-[8px] w-[8px] rounded-full ${fill}`}
        role="img"
        aria-label={entry.label}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-[5px] leading-none ${SIZE[size]} ${TONE_TEXT[entry.tone]} ${fill}`}
    >
      {entry.label}
    </span>
  );
}
