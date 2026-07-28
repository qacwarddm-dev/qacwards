import { NextResponse } from "next/server";
import { PORTAL_USERS } from "@/components/portal/data";
import { DEV_USER_COOKIE } from "@/lib/current-user";

/**
 * Dev-only preview affordance: `?as=<user key>&next=<path>` sets the cookie
 * getCurrentUser() reads, then redirects.
 *
 * **This is not authentication.** It grants nothing, because nothing in phase
 * 3a is gated — it only chooses which fake person the static screens draw. It
 * 404s outside development so it cannot ship by accident, and it is deleted
 * whole (this file, DevUserSwitcher.tsx, one line in PortalTopBar) when real
 * auth lands in phase 3b.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const as = url.searchParams.get("as") ?? "";

  if (!(as in PORTAL_USERS)) {
    return NextResponse.json(
      { error: `Unknown user key "${as}"`, known: Object.keys(PORTAL_USERS) },
      { status: 400 }
    );
  }

  // Same-origin, absolute-path redirects only — never bounce off a caller's URL.
  const requested = url.searchParams.get("next") ?? "";
  const next =
    requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/portal/dashboard";

  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.set(DEV_USER_COOKIE, as, {
    path: "/",
    sameSite: "lax",
    httpOnly: false, // nothing secret; readable so it is obviously not a session
  });
  return response;
}
