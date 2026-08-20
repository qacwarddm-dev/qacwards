"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { Drawer } from "./kit";
import {
  PORTAL_NAV,
  type PortalNavItem,
  type PortalUser,
} from "./portal-nav";

/**
 * Portal sidebar. Geometry measured off assets/FIGMA/qac_personnel: 250px wide,
 * 60px rows, icons centred on x=57.5, labels at x=87.
 *
 * Three responsive modes (09-ui-refactor §5.2 / 09b §3): a `lg+` full rail (this
 * file's original geometry, unchanged), a `md`-only 72px icon rail with a
 * `title` tooltip (no separate Tooltip primitive needed for one word), and a
 * `< md` off-canvas `Drawer` triggered from the top bar's hamburger.
 *
 * The active row's clip-path notch is gone (09-ui-refactor §5.2): a Figma
 * artifact that cost a `drop-shadow` filter per row and read as a rendering
 * glitch at non-integer zoom. The 2px maroon bar carries the active mark alone
 * now. Log Out moved to the top bar's identity menu; the rail foot is empty
 * (a collapse toggle is a `xl+`-only nicety, not built this phase).
 */
const ROW = "relative flex h-[60px] items-center pl-[87px] text-maroon";
const ROW_ICON_ONLY = "relative flex h-[60px] w-full items-center justify-center text-maroon";
const ICON = "absolute left-[57.5px] -translate-x-1/2";
const ICON_SIZE = 29;
const ICON_STROKE = 1.25;

function NavRow({
  item,
  active,
  iconOnly = false,
  onNavigate,
}: {
  item: PortalNavItem;
  active: boolean;
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={iconOnly ? item.label : undefined}
      onClick={onNavigate}
      className={iconOnly ? ROW_ICON_ONLY : ROW}
    >
      {active && (
        <span
          aria-hidden
          className={`absolute top-1/2 h-[42px] w-[2px] -translate-y-1/2 bg-maroon ${iconOnly ? "left-[6px]" : "left-[28px]"}`}
        />
      )}

      <Icon
        className={iconOnly ? undefined : ICON}
        size={item.size ?? ICON_SIZE}
        strokeWidth={ICON_STROKE}
        fill={item.filled && active ? "currentColor" : "none"}
      />
      {!iconOnly && (
        <span className={`text-subheading leading-none ${active ? "font-semibold" : ""}`}>
          {item.label}
        </span>
      )}
      {iconOnly && <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function NavList({
  items,
  pathname,
  iconOnly = false,
  onNavigate,
}: {
  items: PortalNavItem[];
  pathname: string;
  iconOnly?: boolean;
  onNavigate?: () => void;
}) {
  const grouped = items.some((i) => i.group);
  const isActive = (item: PortalNavItem) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (!grouped) {
    return (
      <>
        {items.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            active={isActive(item)}
            iconOnly={iconOnly}
            onNavigate={onNavigate}
          />
        ))}
      </>
    );
  }

  const groups = Array.from(new Set(items.map((i) => i.group)));
  return (
    <>
      {groups.map((group) => (
        <Fragment key={group}>
          {!iconOnly && (
            <p className="t-eyebrow mb-[4px] mt-[16px] px-[24px] text-gray first:mt-0">{group}</p>
          )}
          {items
            .filter((i) => i.group === group)
            .map((item) => (
              <NavRow
                key={item.href}
                item={item}
                active={isActive(item)}
                iconOnly={iconOnly}
                onNavigate={onNavigate}
              />
            ))}
        </Fragment>
      ))}
    </>
  );
}

export function MobileNavTrigger({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = PORTAL_NAV[user.role] ?? [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-[36px] w-[36px] items-center justify-center rounded-full text-white md:hidden"
      >
        <Menu className="h-[22px] w-[22px]" strokeWidth={2} aria-hidden />
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="Portal navigation">
        <nav aria-label="Portal" className="flex flex-col py-[16px]">
          <NavList items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
        </nav>
      </Drawer>
    </>
  );
}

export default function PortalSidebar({ user }: { user: PortalUser }) {
  const pathname = usePathname();
  // Empty until a role's frames land — PORTAL_NAV is deliberately not guessed.
  const items = PORTAL_NAV[user.role] ?? [];

  return (
    <nav
      aria-label="Portal"
      className="hidden w-[72px] shrink-0 flex-col bg-white pt-[16px] pb-[35px] shadow-sidebar md:flex lg:w-[250px]"
    >
      <div className="md:hidden lg:contents">
        <NavList items={items} pathname={pathname} />
      </div>
      <div className="hidden md:contents lg:hidden">
        <NavList items={items} pathname={pathname} iconOnly />
      </div>
    </nav>
  );
}
