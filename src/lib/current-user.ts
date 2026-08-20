import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PortalRole, PortalUser } from "@/components/portal/portal-nav";

/**
 * The identity seam. Everything that needs to know who is signed in goes through
 * `getCurrentUser()`, so the whole portal has exactly one place that answers the
 * question.
 *
 * This is now real: the answer comes from the Supabase session and the `profiles`
 * row behind it. The dev cookie, `src/lib/dev-user.ts` and `/portal/dev/switch`
 * were deleted in B2. Callers, props and components did not change — which was
 * the point of routing every screen through here in phase 3a.
 *
 * Server-only by construction: it builds the cookie-backed server client, which
 * throws in a client component, so a stray client import fails at build time
 * rather than shipping identity code to the browser.
 *
 * Wrapped in React's `cache` so a request that renders the layout, the sidebar
 * and a page resolves one user once rather than three times.
 */

/** The signed-in user plus the fields only server code needs. */
export type CurrentUser = PortalUser & {
  id: string;
  role: PortalRole;
  webmail: string;
  avatarPath: string | null;
};

const AVATAR_FALLBACK = "/assets/portal/avatar-placeholder.png";

/** The top bar prints "Surname, Given Name M.I." */
function displayName(
  surname: string,
  givenName: string,
  middleInitial: string | null,
): string {
  const initial = middleInitial ? ` ${middleInitial}` : "";
  return `${surname}, ${givenName}${initial}`.trim();
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // One row, and RLS already restricts it to the caller's own. A deactivated user
  // is filtered here as well as in middleware: the session can still be warm when
  // an admin flips is_active, and the next request must fail, not the next login.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, surname, given_name, middle_initial, webmail, avatar_path, is_active, positions(name)",
    )
    .eq("id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile) return null;

  return {
    id: profile.id,
    role: profile.role,
    name: displayName(profile.surname, profile.given_name, profile.middle_initial),
    // The bar shows the person's PUP position; before B3 assigns one it falls
    // back to the role label rather than rendering an empty slot.
    position: profile.positions?.name ?? ROLE_LABELS[profile.role],
    avatar: profile.avatar_path ?? AVATAR_FALLBACK,
    webmail: profile.webmail,
    avatarPath: profile.avatar_path,
    // Real counts land in B8; until the notifications table exists this is 0,
    // which is honest, where a fake number would not be.
    notifications: 0,
  };
});

/**
 * How each role is named in the UI. `program_representative` reads "Academic
 * Program" per `docs/OtherContext.txt` while the enum keeps its original value
 * (open item O-4).
 */
export const ROLE_LABELS: Record<PortalRole, string> = {
  program_representative: "Academic Program",
  internal_accreditor: "Internal Accreditor",
  qac_personnel: "QAC Personnel",
  qac_admin: "QAC Admin",
};

/**
 * For layouts and pages that cannot render without a user. Middleware already
 * redirects unauthenticated requests, so reaching this means the session died
 * mid-render or the profile was deactivated — both are "send them to login".
 */
export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
