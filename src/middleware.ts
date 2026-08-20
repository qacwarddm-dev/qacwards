import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * The signed-in gate.
 *
 * It answers exactly one question — **are you signed in, and is your account
 * still active** — and nothing else. Whether *this* representative may read
 * programme 999 is RLS's job, and the answer there is zero rows and a 404, never
 * a hidden UI element (plans/BACKEND.md §1, §B10).
 *
 * The matcher is `/portal/:path*`, which fails closed: a new portal route is
 * protected the moment it exists, because it has to opt *out* rather than opt in.
 */
export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);

  if (!user) {
    const login = new URL("/login", request.url);
    // Carry where they were headed, path-only — see safeNextParam below.
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  // A deactivated user's session stays valid until it expires, so is_active has
  // to be read per request from the row an admin actually flips. Mirroring it into
  // app_metadata would be cheaper but wrong: the JWT only refreshes on rotation,
  // so a deactivated user would keep their access for the rest of the token's life.
  // UC-019 means "locked out now", not "locked out at next login".
  //
  // This mirrors the same predicate in every RLS policy; neither check is
  // redundant, because middleware protects pages and RLS protects data.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    const login = new URL("/login", request.url);
    login.searchParams.set("deactivated", "1");
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/portal/:path*"],
};
