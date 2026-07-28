import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";
import { getCurrentUser } from "@/lib/current-user";

/**
 * Portal shell. `/portal` is a literal path segment, not a `(portal)` route
 * group — a group contributes nothing to the URL, so `(portal)/accreditations`
 * would collide with the public `/accreditations`. See plans/03a-portal-ui-static.md.
 *
 * No auth here yet: phase 3a is static UI only.
 *
 * `portal-scale` scales the sidebar + page to the window so the 1440x810 frame's
 * proportions survive on a wider monitor — see globals.css.
 *
 * The top bar sits *outside* that scale, and deliberately: it has to stay the
 * same height as the public navbar, which is unscaled site chrome pinned at
 * 80px. Inside the shell it would grow with --portal-scale and the two bars
 * would only agree at 1440. Unscaled here, they agree at every width. This is
 * the same split the auth screens already use — hence `portal-scale` subtracting
 * the same 80px from the window that `auth-scale` does.
 *
 * The signed-in person is resolved once, here, and passed down. The sidebar is
 * a client component (it needs `usePathname`), so it has to *receive* the user
 * rather than look one up.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col overflow-hidden">
      <PortalTopBar user={user} />
      <div className="portal-scale flex min-h-0">
        <PortalSidebar user={user} />
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
