import { NextResponse } from "next/server";
import { createJobClient, cronAuthorized } from "@/lib/supabase/mailer";

/**
 * The one notification in §8.5 with no triggering write: an award crossing
 * `valid_until` is the passage of time, not a database change, so nothing fires.
 *
 * The work itself is `public.notify_expiring_awards()` in SQL, not here. Both
 * pg_cron and this route call the same function, so the behaviour does not
 * depend on which scheduler a deployment happens to have — and because the
 * function skips recipients who already hold that notice, running both is
 * harmless rather than a double send.
 */

export const dynamic = "force-dynamic";

async function run(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { client, error: authError } = await createJobClient();
  if (!client) {
    return NextResponse.json({ error: authError }, { status: 500 });
  }

  const { data, error } = await client.rpc("notify_expiring_awards", { p_days: 60 });

  await client.auth.signOut();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notified: data ?? 0 });
}

export const GET = run;
export const POST = run;
