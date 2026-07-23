import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

/**
 * Bold trail above the document grid. A single crumb renders as the plain page
 * title ("Campuses", "Main Campus"). The prototype truncates the last crumb
 * when the trail runs long ("AACCUP Certific...").
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-[14px] text-heading font-semibold leading-none text-black"
    >
      {items.map((item, i) => (
        <span key={item.label} className="flex min-w-0 items-center gap-[14px]">
          {i > 0 && (
            <ChevronRight className="h-[22px] w-[22px] shrink-0" strokeWidth={2.5} aria-hidden />
          )}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="shrink-0 transition-opacity hover:opacity-70">
              {item.label}
            </Link>
          ) : (
            <span className="truncate">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
