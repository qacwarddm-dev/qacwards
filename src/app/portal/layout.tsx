import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalTopBar from "@/components/portal/PortalTopBar";

/**
 * Portal shell. `/portal` is a literal path segment, not a `(portal)` route
 * group — a group contributes nothing to the URL, so `(portal)/accreditations`
 * would collide with the public `/accreditations`. See plans/03a-portal-ui-static.md.
 *
 * No auth here yet: phase 3a is static UI only.
 *
 * `portal-scale` scales the whole shell to the window so the 1440x810 frame's
 * proportions survive on a wider monitor — see globals.css. It belongs here, on
 * the shell, because the top bar and sidebar have to scale in step with the
 * page beside them.
 */
export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="portal-scale flex flex-col overflow-hidden">
      <PortalTopBar />
      <div className="flex min-h-0 flex-1">
        <PortalSidebar />
        <main className="flex-1 overflow-y-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
