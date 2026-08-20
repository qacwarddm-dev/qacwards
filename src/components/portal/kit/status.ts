/**
 * Single source for every status the workflow renders as a pill (09b §9).
 * Tones map to frozen tokens only — never a new colour: `success` ->
 * `--color-approved`, `warning` -> `--color-yellow` **with black text** (the
 * same contrast fix StatusPill already carries for `pending`), `danger` ->
 * `--color-maroon`, `info` -> `--color-holiday`, `neutral` -> `--color-gray`.
 */
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export const STATUS = {
  // documents (original three — kept for the existing DocStatus call sites)
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  disapproved: { label: "Disapproved", tone: "danger" },
  // submissions
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under review", tone: "info" },
  returned: { label: "Returned", tone: "warning" },
  // assignments (enum order: assigned -> in_progress -> for_psv -> evaluated -> score_returned)
  assigned: { label: "Assigned", tone: "info" },
  in_progress: { label: "In progress", tone: "info" },
  for_psv: { label: "For PSV", tone: "warning" },
  evaluated: { label: "Evaluated", tone: "success" },
  score_returned: { label: "Score returned", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
  // cycles / accounts / NDA
  open: { label: "Open", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
  active: { label: "Active", tone: "success" },
  disabled: { label: "Disabled", tone: "neutral" },
  signed: { label: "Signed", tone: "success" },
  unsigned: { label: "Not signed", tone: "warning" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export type StatusKey = keyof typeof STATUS;

export const TONE_FILL: Record<StatusTone, string> = {
  success: "bg-[color:var(--color-approved)]",
  warning: "bg-yellow",
  danger: "bg-maroon",
  info: "bg-[color:var(--color-holiday)]",
  neutral: "bg-[color:var(--color-gray)]",
};

/* White text everywhere except warning (yellow), which measures ~1.9:1 with
   white and passes well over 4.5:1 with black — the same fix as pre-registry
   StatusPill (09-ui-refactor §8), generalised to every tone that shares the
   fill. */
export const TONE_TEXT: Record<StatusTone, string> = {
  success: "text-white",
  warning: "text-black",
  danger: "text-white",
  info: "text-white",
  neutral: "text-white",
};
