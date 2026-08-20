import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendMail } from "@/lib/email";

/**
 * Drains `email_outbox`. Shared by the daily cron sweep
 * (`/api/cron/email`, running as the mailer job account) and the QAC Admin
 * "Send queued emails now" button (`/portal/settings`, running as the caller's
 * own session) — both just need a client that can read/update `email_outbox`
 * under RLS; this function does not care which kind of client it is.
 *
 * The queue exists because a Postgres trigger cannot open an SMTP connection.
 * That split is also what gives decision 14 its "retry and a failure log": the
 * attempt count, the backoff and the last error all live on the row, so a
 * bounced address is *visible* instead of disappearing into a server log
 * nobody reads.
 */

/** Five tries over roughly half an hour, then the row is marked failed and left
 *  alone. Retrying forever turns one bad address into an unbounded queue. */
const MAX_ATTEMPTS = 5;

/** How many to send per invocation. Bounded so a backlog cannot run the caller
 *  past a serverless timeout — the next drain picks up the rest. */
const BATCH = 25;

function backoffMinutes(attempts: number): number {
  return Math.min(2 ** attempts, 30);
}

export type DrainResult = {
  claimed: number;
  sent: number;
  retrying: number;
  failed: number;
};

export async function drainEmailOutbox(
  client: SupabaseClient<Database>,
): Promise<DrainResult> {
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await client
    .from("email_outbox")
    .select("id, to_email, subject, body, attempts")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .order("created_at")
    .limit(BATCH);

  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  let retrying = 0;

  for (const row of rows ?? []) {
    const result = await sendMail(row.to_email, row.subject, row.body);

    if (result.ok) {
      await client
        .from("email_outbox")
        .update({
          status: "sent",
          attempts: row.attempts + 1,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    const attempts = row.attempts + 1;
    const giveUp = attempts >= MAX_ATTEMPTS;

    await client
      .from("email_outbox")
      .update({
        status: giveUp ? "failed" : "pending",
        attempts,
        last_error: result.error,
        next_attempt_at: new Date(
          Date.now() + backoffMinutes(attempts) * 60_000,
        ).toISOString(),
      })
      .eq("id", row.id);

    if (giveUp) failed += 1;
    else retrying += 1;
  }

  return { claimed: rows?.length ?? 0, sent, retrying, failed };
}
