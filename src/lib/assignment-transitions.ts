/**
 * The two state machines behind assignments and submissions.
 *
 * Plain transition tables plus a Postgres enum rather than XState (§0.2): two
 * machines with at most six states each, where a library would add a
 * dependency and a second place for the truth to live. The tables below are
 * the whole of the logic.
 *
 * Split out of `assignment-actions.ts` (a `"use server"` module) because
 * Next.js requires every export of a `"use server"` file to be an async
 * function — these are plain sync helpers, not actions.
 */

/** `assignment.status` — exactly the 5-step Stepper in `ASSIGNMENT_STEPS`. */
const ASSIGNMENT_TRANSITIONS: Record<string, string[]> = {
  assigned: ["in_progress"],
  in_progress: ["for_psv"],
  for_psv: ["evaluated"],
  evaluated: ["score_returned"],
  score_returned: [],
};

const SUBMISSION_TRANSITIONS: Record<string, string[]> = {
  not_started: ["in_progress"],
  in_progress: ["submitted"],
  submitted: ["under_evaluation"],
  under_evaluation: ["evaluated", "returned"],
  evaluated: [],
  returned: ["in_progress"],
};

export function canAdvanceAssignment(from: string, to: string): boolean {
  return ASSIGNMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canAdvanceSubmission(from: string, to: string): boolean {
  return SUBMISSION_TRANSITIONS[from]?.includes(to) ?? false;
}
