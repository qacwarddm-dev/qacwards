import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * The client-component Supabase client.
 *
 * Anon key only. Everything it can read or write is decided by RLS against the
 * user's JWT, which is why shipping this key to the browser is safe and why the
 * service-role key must never appear on this side of the wire (plans/BACKEND.md
 * §1 — a service-role key in a request path is a full RLS bypass).
 *
 * `createBrowserClient` memoises per browser context, so calling this in several
 * components does not open several connections.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
