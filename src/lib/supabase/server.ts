import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * The server-side Supabase client — Server Components, Server Actions and Route
 * Handlers.
 *
 * Still the **user's** client: anon key plus whatever session lives in the
 * request cookies, so every query runs under that user's JWT and RLS decides the
 * answer. This is the only client any request path may use (plans/BACKEND.md
 * §1). Service role is confined to seeds and migrations.
 *
 * `cookies()` is dynamic, so any route calling this opts out of static rendering
 * — which is correct for the portal and irrelevant to the static public site.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. Harmless: the middleware
            // client (./middleware.ts) refreshes the session on every request,
            // so a token rotated during a render is persisted there instead.
          }
        },
      },
    },
  );
}
