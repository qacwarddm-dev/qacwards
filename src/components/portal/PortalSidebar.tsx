"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import Icon from "./kit/Icon";
import { flatNav, navForUser, type NavBadge, type PortalNavItem, type PortalUser } from "./portal-nav";

function activeHref(items: PortalNavItem[], pathname: string) {
  const hits = items.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return hits.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function NavLink({ item, on, count }: { item: PortalNavItem; on: boolean; count?: number }) {
  return (
    <Link href={item.href} className={on ? "on" : undefined} title={item.label} aria-current={on ? "page" : undefined}>
      <Icon name={item.icon} />
      <span className="nl">{item.label}</span>
      {count ? <span className="cnt">{count}</span> : null}
      {item.newTag && <span className="new">NEW</span>}
    </Link>
  );
}

export default function PortalSidebar({
  user,
  counts,
}: {
  user: PortalUser;
  counts: Partial<Record<NavBadge, number>>;
}) {
  const pathname = usePathname();
  const nav = navForUser(user);
  const on = activeHref(flatNav(nav), pathname);

  return (
    <nav aria-label="Portal">
      {nav.groups.map((g) => (
        <Fragment key={g.title}>
          <div className="nsec">{g.title}</div>
          {g.items.map((item) => (
            <NavLink key={item.href + g.title} item={item} on={on === item.href} count={item.badge ? counts[item.badge] : undefined} />
          ))}
        </Fragment>
      ))}
      {nav.help && (
        <div className="nav-foot">
          <NavLink item={nav.help} on={on === nav.help.href} />
        </div>
      )}
    </nav>
  );
}
