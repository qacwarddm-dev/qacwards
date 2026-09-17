/**
 * QAC's "Feedback" screen (assets/new frames/EVENTS/Feedbacks.png, duplicated
 * under "Event Calendar.png" / "Event Schedule.png" — the client exported the
 * same frame three times under different names; see the sidebar, which is on
 * "Feedback" in all three) and the Program Rep "QAC Service Evaluation"
 * submission it aggregates (assets/new frames/feedback submissions/image.png).
 *
 * No `service_evaluations`/`feedback` table exists yet (nothing in
 * database.types.ts), so — same convention as
 * `src/lib/extension-monitoring.ts` — this is fixture rows aggregated at read
 * time rather than a hand-drawn chart curve, so the swap to a real table only
 * has to replace `FEEDBACK` with a query.
 */

export type FeedbackEntry = {
  id: string;
  program: string;
  campus: string;
  level: string;
  rating: number; // 1-5, average of that programme's responses
  responseCount: number;
  submittedAt: string; // ISO date, used to bucket the monthly series
};

const FEEDBACK: FeedbackEntry[] = [
  { id: "1", program: "Bachelor of Science in Computer Science", campus: "Sta. Mesa, Manila", level: "Level II", rating: 4.5, responseCount: 6, submittedAt: "2026-01-15" },
  { id: "2", program: "Bachelor of Science in Information Technology", campus: "Sta. Mesa, Manila", level: "Level III", rating: 0, responseCount: 0, submittedAt: "2026-09-01" },
  { id: "3", program: "Bachelor of Elementary Education", campus: "Sta. Mesa, Manila", level: "Level II", rating: 3.7, responseCount: 4, submittedAt: "2026-02-10" },
  { id: "4", program: "Bachelor of Science in Civil Engineering", campus: "Sta. Mesa, Manila", level: "Level III", rating: 3.9, responseCount: 5, submittedAt: "2026-04-22" },
  { id: "5", program: "Bachelor of Science in Hospitality Management", campus: "Sta. Mesa, Manila", level: "Level II", rating: 4.4, responseCount: 3, submittedAt: "2026-06-30" },
  { id: "6", program: "Bachelor of Science in Accountancy", campus: "Sta. Mesa, Manila", level: "Level IV", rating: 4.8, responseCount: 7, submittedAt: "2026-08-18" },
  { id: "7", program: "Bachelor of Science in Architecture", campus: "Sta. Mesa, Manila", level: "Level II", rating: 5, responseCount: 2, submittedAt: "2026-09-05" },
];

export async function getFeedbackList(): Promise<FeedbackEntry[]> {
  return FEEDBACK;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Monthly average of every rated response, forward-filled across months with
 * no submissions — a flat run between two data points reads as "still the
 * last known standing," which is what "Overall Summary" means for a metric
 * that only updates when someone submits, rather than the chart crashing to
 * the axis floor every month nobody happened to respond.
 */
export async function getFeedbackMonthlySeries(): Promise<{ labels: string[]; series: number[] }> {
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);

  for (const f of FEEDBACK) {
    if (f.responseCount === 0) continue;
    const month = new Date(f.submittedAt).getMonth();
    sums[month] += f.rating;
    counts[month] += 1;
  }

  const monthly = sums.map((s, i) => (counts[i] > 0 ? Math.round((s / counts[i]) * 10) / 10 : null));
  const firstKnown = monthly.find((v): v is number => v !== null) ?? 0;

  let last = firstKnown;
  const series = monthly.map((v) => {
    if (v !== null) last = v;
    return last;
  });

  return { labels: MONTHS, series };
}
