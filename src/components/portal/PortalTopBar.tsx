import Image from "next/image";
import Link from "next/link";
import BrandLockup from "@/components/BrandLockup";
import DevUserSwitcher from "./DevUserSwitcher";
import NotificationBell from "./NotificationBell";
import { NOTIFICATIONS } from "./data";
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
 * `relative` carries the dev switcher only; it is absolutely positioned in the
 * bar's empty middle so it contributes no layout and the measured geometry of
 * the confirmed screens is untouched.
 */
export default function PortalTopBar({ user }: { user: PortalUser }) {
  return (
    <header className="relative flex h-[80px] shrink-0 items-center bg-maroon pl-[25px] pr-[25px] text-white">
      {/* Same `.brand-lockup` wrapper as the public navbar. Now that this bar is
          outside the shell, the lockup no longer picks up --portal-scale by
          inheritance, and the class is what puts both bars back on one factor. */}
      <span className="brand-lockup flex min-w-0 items-center">
        <BrandLockup tone="white" />
      </span>

      <DevUserSwitcher user={user} />

      <div className="ml-auto flex items-center">
        <NotificationBell count={user.notifications} items={NOTIFICATIONS} />

        <Link
          href="/portal/profile"
          className="ml-[14px] flex items-center transition-opacity hover:opacity-85"
        >
          <span className="flex flex-col text-right">
            <span className="text-subheading font-semibold leading-[17px]">
              {user.name}
            </span>
            <span className="text-subheading leading-[17px]">
              {user.position}
            </span>
          </span>

          <Image
            src={user.avatar}
            alt=""
            width={80}
            height={80}
            className="ml-[14px] h-[40px] w-[40px] rounded-full object-cover"
          />
        </Link>
      </div>
    </header>
  );
}
