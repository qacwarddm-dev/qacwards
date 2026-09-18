"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { Drawer } from "./kit";
import {
  navForUser,
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
 * The active row's clip-path notch was dropped once (09-ui-refactor §5.2) — a
 * Figma artifact that cost a `drop-shadow` filter per row and read as a
 * rendering glitch at non-integer zoom, since `clip-path` on the row itself
 * has to line up exactly with the page's own background at every zoom level.
 * Back now as `NotchFlag`, a small filled SVG triangle painted *over* the
 * white rail in `--color-surface` (the page's own grey) instead of clipping
 * the row — same "draw the shape, don't clip the box" convention `DocTabs`/
 * `EventsTabs` already use for their curves, and it sidesteps the seam
 * entirely since nothing is being clipped against anything. Full rail only
 * (`lg+`); the `md` icon rail is too narrow to spare the width for it.
 */
const ROW = "relative flex h-[60px] items-center pl-[87px] text-maroon";
const ROW_ICON_ONLY = "relative flex h-[60px] w-full items-center justify-center text-maroon";
const ICON = "absolute left-[57.5px] -translate-x-1/2";
const ICON_SIZE = 29;
const ICON_STROKE = 1.25;
const NOTCH_W = 24;
const NOTCH_H = 32;

/** A triangular bite out of the rail's own right edge, tip pointing inward —
 *  measured off the client's reference shot at roughly 24px deep by 32px
 *  tall. Filled with the page background, not clipped out of the row. */
function NotchFlag() {
  return (
    <svg
      width={NOTCH_W}
      height={NOTCH_H}
      viewBox={`0 0 ${NOTCH_W} ${NOTCH_H}`}
      className="absolute right-0 top-1/2 -translate-y-1/2"
      aria-hidden
    >
      <path
        d={`M ${NOTCH_W} 0 L 0 ${NOTCH_H / 2} L ${NOTCH_W} ${NOTCH_H} Z`}
        fill="var(--color-surface)"
      />
    </svg>
  );
}

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
      {active && !iconOnly && <NotchFlag />}

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
  const items = navForUser(user);

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
  // `navForUser` adds the accreditor item a dual-role account needs (round 2 §2).
  const items = navForUser(user);

  return (
    <nav
      aria-label="Portal"
      className="hidden w-[72px] shrink-0 flex-col overflow-y-auto bg-white pt-[16px] pb-[35px] shadow-sidebar md:flex lg:w-[250px]"
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
