import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
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
 *
 * One sign-in per server instance, then the session is reused and refreshed.
 * Any portal render can trigger an email flush, and a password sign-in per flush
 * spends Supabase's per-IP sign-in limit (30 per 5 minutes), which registration's
 * own sign-in here also needs. Callers must not sign this client out.
 */
type JobResult = { client: SupabaseClient<Database>; error: null } | { client: null; error: string };

const REFRESH_MARGIN_S = 300;

let cached: SupabaseClient<Database> | null = null;
let inflight: Promise<JobResult> | null = null;

async function signIn(email: string, password: string): Promise<JobResult> {
  const client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { client: null, error: error.message };
  cached = client;
  return { client, error: null };
}

async function current(email: string, password: string): Promise<JobResult> {
  if (cached) {
    const { data } = await cached.auth.getSession();
    if ((data.session?.expires_at ?? 0) - Date.now() / 1000 > REFRESH_MARGIN_S) return { client: cached, error: null };
    const { error } = await cached.auth.refreshSession();
    if (!error) return { client: cached, error: null };
    cached = null;
  }
  return signIn(email, password);
}

export async function createJobClient(): Promise<JobResult> {
  const email = process.env.MAILER_EMAIL;
  const password = process.env.MAILER_PASSWORD;
  if (!email || !password) return { client: null, error: "MAILER_EMAIL / MAILER_PASSWORD are not set." };
  inflight ??= current(email, password).finally(() => {
    inflight = null;
  });
  return inflight;
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
