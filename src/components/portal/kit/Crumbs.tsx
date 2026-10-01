import Link from "next/link";
import { Fragment } from "react";

export type Crumb = { label: React.ReactNode; href?: string; onClick?: () => void };

export default function Crumbs({ items, big }: { items: Crumb[]; big?: boolean }) {
  return (
    <div className={big ? "bcr" : "crumb"}>
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span>›</span>}
          {c.href ? (
            <Link href={c.href}>{c.label}</Link>
          ) : c.onClick ? (
            <a role="button" tabIndex={0} onClick={c.onClick}>
              {c.label}
            </a>
          ) : big ? (
            <b>{c.label}</b>
          ) : (
            <b style={{ color: "var(--text)" }}>{c.label}</b>
          )}
        </Fragment>
      ))}
    </div>
  );
}
