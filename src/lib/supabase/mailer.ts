import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * The client the scheduled jobs run as.
 *
 * Cron has no browser and therefore no session cookie, and this file exists
 * because the obvious answer to that — the service role key — is barred:
 * `./server.ts` confines service role to seeds and migrations, and a key that
 * bypasses every policy in the database is far too large an instrument for
 * draining one mail queue. One leak of it is a full read of every programme's
 * documents.
 *
 * So the jobs sign in as a **dedicated QAC Admin account** with a password like
 * any other user. RLS applies to it exactly as written; if the mailer account
 * cannot see a row, neither can the job. The blast radius of that credential
 * leaking is one admin account, which is revocable from `/portal/settings/users`
 * without a redeploy.
 *
 * `persistSession: false` matters: this runs in a shared server process, and a
 * persisted session would be a global one every subsequent request could reach.
 */
export async function createJobClient() {
  const email = process.env.MAILER_EMAIL;
  const password = process.env.MAILER_PASSWORD;

  if (!email || !password) {
    return { client: null, error: "MAILER_EMAIL / MAILER_PASSWORD are not set." } as const;
  }

  const client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { client: null, error: error.message } as const;

  return { client, error: null } as const;
}

/**
 * Shared guard for the cron routes. A scheduled endpoint is reachable by anyone
 * who knows the URL, so the secret is what makes it a job rather than a public
 * button — and a missing secret must **deny**, not wave the request through,
 * which is the failure mode of every "if configured" check.
 */
export function cronAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${expected}`;
}
