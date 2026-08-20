import { NextResponse } from "next/server";
import { createJobClient, cronAuthorized } from "@/lib/supabase/mailer";
import { drainEmailOutbox } from "@/lib/mailer-drain";

/**
 * Daily safety-net sweep of `email_outbox`, running as a QAC Admin session
 * (never the service role — see `src/lib/supabase/mailer.ts`).
 *
 * Vercel's Hobby plan only runs cron jobs once a day, so this is no longer the
 * primary delivery path — `/portal/settings`'s "Send queued emails now" button
 * (`sendQueuedEmailsNow` in `src/lib/admin.ts`) is what makes delivery
 * demonstrable on demand. This route exists so nothing queued is ever stuck for
 * more than a day even if nobody clicks the button.
 */

export const dynamic = "force-dynamic";

async function drain(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { client, error: authError } = await createJobClient();
  if (!client) {
    return NextResponse.json({ error: authError }, { status: 500 });
  }

  try {
    const result = await drainEmailOutbox(client);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.auth.signOut();
  }
}

// Vercel Cron issues GET and supplies `Authorization: Bearer $CRON_SECRET`
// itself; POST is kept so the job can be triggered by hand or by any other
// scheduler. Both go through the same secret check.
export const GET = drain;
export const POST = drain;
