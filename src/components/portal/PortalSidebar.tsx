"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import {
  PORTAL_NAV,
  type PortalNavItem,
  type PortalUser,
} from "./portal-nav";

/**
 * Portal sidebar. Geometry measured off assets/FIGMA/qac_personnel: 250px wide,
 * 60px rows, icons centred on x=57.5, labels at x=87.
 *
 * Icons are absolutely positioned so their size can vary without moving the
 * labels — the prototype's icon set has less internal padding than Lucide's.
 *
 * The active row carries three marks in the prototype: a heavier label, a 2px
 * maroon bar at x=28, and a triangular notch bitten out of the sidebar's right
 * edge by the content background.
 */
const ROW = "relative flex h-[60px] items-center pl-[87px] text-maroon";
const ICON = "absolute left-[57.5px] -translate-x-1/2";
const ICON_SIZE = 29;
const ICON_STROKE = 1.25;

function NavRow({ item, active }: { item: PortalNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={ROW}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-[28px] top-1/2 h-[42px] w-[2px] -translate-y-1/2 bg-maroon"
        />
      )}

      <Icon
        className={ICON}
        size={item.size ?? ICON_SIZE}
        strokeWidth={ICON_STROKE}
        fill={item.filled && active ? "currentColor" : "none"}
      />
      <span
        className={`text-subheading leading-none ${active ? "font-semibold" : ""}`}
      >
        {item.label}
      </span>

      {active && (
        <span
          aria-hidden
          className="absolute right-0 top-1/2 h-[27px] w-[23px] -translate-y-1/2 bg-surface"
          style={{
            clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
            filter: "drop-shadow(-2px 0 3px rgba(0,0,0,0.06))",
          }}
        />
      )}
    </Link>
  );
}

export default function PortalSidebar({ user }: { user: PortalUser }) {
  const pathname = usePathname();
  const router = useRouter();
  // Empty until a role's frames land — PORTAL_NAV is deliberately not guessed.
  const items = PORTAL_NAV[user.role] ?? [];

  // Real sign-out: end the Supabase session, then refresh so the server
  // re-renders without a user and middleware sends the next request to /login.
  // `refresh()` matters — without it the client keeps the already-rendered
  // authenticated tree on screen after the session is gone.
  async function handleLogOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="flex w-[250px] shrink-0 flex-col bg-white pt-[16px] pb-[35px] shadow-sidebar">
      {items.map((item) => (
        <NavRow
          key={item.href}
          item={item}
          active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
        />
      ))}

      <button type="button" onClick={handleLogOut} className={`mt-auto ${ROW}`}>
        <LogOut className={ICON} size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        <span className="text-subheading leading-none">Log Out</span>
      </button>
    </nav>
  );
}
