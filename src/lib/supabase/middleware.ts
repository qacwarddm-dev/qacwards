import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Session refresh for `src/middleware.ts`.
 *
 * Server Components cannot write cookies, so a rotated refresh token has to be
 * persisted somewhere that can — this is that place. It runs on every matched
 * request, calls `getUser()` (which validates the JWT against the Auth server,
 * unlike `getSession()`, which trusts whatever the cookie says), and hands back
 * both the user and a response carrying any refreshed cookies.
 *
 * It deliberately answers only **"are you signed in"**. Whether *this* rep may
 * read program 999 is RLS's job, and the answer there is zero rows (§1). The
 * role gate and the `is_active` check land in B2 on top of this.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Must not be removed and must not be reordered above the client creation:
  // this call is what refreshes an expiring token, and the refreshed cookie is
  // only captured because setAll rebuilt `response` above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
