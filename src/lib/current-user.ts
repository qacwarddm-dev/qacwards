import { cookies } from "next/headers";
import {
  DEFAULT_PORTAL_USER,
  PORTAL_USERS,
  type PortalUserKey,
} from "@/components/portal/data";
import type { PortalUser } from "@/components/portal/portal-nav";
import { DEV_USER_COOKIE } from "@/lib/dev-user";

/**
 * The identity seam. Everything that needs to know who is signed in goes
 * through `getCurrentUser()`, so the whole portal has exactly one place that
 * answers the question.
 *
 * Server-only by construction: `next/headers` throws in a client component, so
 * a stray client import fails loudly at build time rather than shipping the
 * user list to the browser.
 *
 * **This is not authentication and must never be mistaken for it.** Phase 3a is
 * static UI (plans/03a-portal-ui-static.md): there is no Supabase client, no
 * middleware and no session, so the answer comes from a dev cookie that anyone
 * can set. Nothing is gated on it.
 *
 * When phase 3b lands, only this function body changes:
 *
 *     const { data } = await supabase.auth.getUser();
 *     const role = data.user?.app_metadata.role;   // never user_metadata —
 *                                                  // users can edit their own
 *
 * The callers, the props and the components stay exactly as they are.
 */

/** Re-exported for server callers that already import it from here (the
 *  dev-switch route). The definition lives in `@/lib/dev-user` so client code
 *  can share it without dragging `next/headers` into the browser bundle. */
export { DEV_USER_COOKIE };

function isKnownUser(key: string | undefined): key is PortalUserKey {
  return key !== undefined && key in PORTAL_USERS;
}

export async function getCurrentUser(): Promise<PortalUser> {
  const key = (await cookies()).get(DEV_USER_COOKIE)?.value;
  return PORTAL_USERS[isKnownUser(key) ? key : DEFAULT_PORTAL_USER];
}
