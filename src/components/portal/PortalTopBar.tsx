import Image from "next/image";
import BrandLockup from "@/components/BrandLockup";
import CommandPaletteTrigger from "./CommandPaletteTrigger";
import IdentityMenu from "./IdentityMenu";
import { MobileNavTrigger } from "./PortalSidebar";
import NotificationBell from "./NotificationBell";
import { getNotifications } from "@/lib/notifications";
import type { PortalUser } from "./portal-nav";

/**
 * Portal top bar. Measured off assets/FIGMA/qac_personnel/01-Dashboard.png —
 * pixel-identical across all twelve exported frames, so it lives in the shell.
 * Frame is a 2x export of a 1440 design, so every export measurement is halved.
 *
 * Height is 80px, not the frame's 59: the client wants this bar and the public
 * navbar the same size, and 80 is the one the public bar is pinned to (the auth
 * screens reserve exactly that — `auth-scale`, globals.css). Matching the number
 * is only half of it. This bar renders *outside* `portal-scale` (see
 * portal/layout.tsx) so it lives in the same unscaled coordinate space as the
 * public navbar; left inside the shell it would draw 80 x scale on any window
 * wider than 1440 and the two would drift apart again.
 *
 * The mobile menu trigger (`< md`) opens `PortalSidebar`'s `Drawer`; the
 * identity block is now a `Popover` menu (`IdentityMenu`) rather than a bare
 * link, so Log Out lives there instead of competing with navigation in the
 * rail (09-ui-refactor §5.1).
 */
export default async function PortalTopBar({ user }: { user: PortalUser }) {
  // The bar is already a server component, so the bell's rows are fetched here
  // rather than threaded through the layout. `user.notifications` is no longer
  // the count — that comes back with the list, so the badge and the rows can
  // never disagree.
  const { items, unread } = await getNotifications();

  return (
    <header className="on-maroon relative flex h-[80px] shrink-0 items-center gap-[12px] bg-maroon pl-[16px] pr-[16px] text-white md:pl-[25px] md:pr-[25px]">
      <MobileNavTrigger user={user} />

      {/* Same `.brand-lockup` wrapper as the public navbar. Now that this bar is
          outside the shell, the lockup no longer picks up --portal-scale by
          inheritance, and the class is what puts both bars back on one factor. */}
      <span className="brand-lockup flex min-w-0 items-center">
        <BrandLockup tone="white" />
      </span>

      <div className="ml-auto flex items-center gap-[12px]">
        <CommandPaletteTrigger />
        <NotificationBell count={unread} items={items} />
        <IdentityMenu user={user}>
          <span className="hidden flex-col text-right sm:flex">
            <span className="text-subheading font-semibold leading-[17px]">{user.name}</span>
            <span className="text-subheading leading-[17px]">{user.position}</span>
          </span>
          <Image
            src={user.avatar}
            alt=""
            width={80}
            height={80}
            className="ml-[14px] h-[40px] w-[40px] rounded-full object-cover"
          />
        </IdentityMenu>
      </div>
    </header>
  );
}
