import CommandPalette from "@/components/portal/CommandPalette";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";
import { ToastProvider } from "@/components/portal/kit";
import { requireCurrentUser } from "@/lib/current-user";

/**
 * Portal shell. `/portal` is a literal path segment, not a `(portal)` route
 * group — a group contributes nothing to the URL, so `(portal)/accreditations`
 * would collide with the public `/accreditations`. See plans/03a-portal-ui-static.md.
 *
 * No auth here yet: phase 3a is static UI only.
 *
 * The shell is pinned to `h-dvh`, not the `--portal-scale` zoom this used
 * before Phase 6 — see globals.css for why that layer was removed. `<body>`
 * only has `min-h-full`, so without an explicit height here the wrapper would
 * size to its content and the whole page (top bar and sidebar included) would
 * scroll with it on any screen short of the content. `h-dvh` bounds it to the
 * viewport so `overflow-hidden` actually clips, leaving `<main>`'s own
 * `overflow-y-auto` as the only scrolling region — top bar and sidebar stay
 * fixed in place. The top bar stays a fixed 80px so it matches the public
 * navbar's height at every width.
 *
 * The signed-in person is resolved once, here, and passed down. The sidebar is
 * a client component (it needs `usePathname`), so it has to *receive* the user
 * rather than look one up.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();

  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only rounded-full bg-maroon px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <div className="flex h-dvh flex-col overflow-hidden">
        <PortalTopBar user={user} />
        <div className="flex min-h-0 flex-1">
          <PortalSidebar user={user} />
          <main id="main" className="flex-1 overflow-y-auto bg-surface">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette user={user} />
    </ToastProvider>
  );
}
