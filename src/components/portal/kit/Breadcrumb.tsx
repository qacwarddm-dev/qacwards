import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type Crumb = { label: string; href?: string };

/**
 * Crumb trail. Two measured looks:
 *
 * - `page` — the bold 20px heading above the document grid. A single crumb
 *   renders as the plain page title ("Campuses", "Main Campus"); the prototype
 *   truncates the last crumb when the trail runs long ("AACCUP Certific...").
 * - `trail` — the small grey line *outside* the panel on the Submissions
 *   screens (program_representative/07-Submissions(Phases).png): 12px regular,
 *   9px gaps, a 16px chevron.
 */
const VARIANTS = {
  page: {
    list: "gap-[14px] text-heading font-semibold leading-none text-black",
    chevron: "h-[22px] w-[22px]",
    stroke: 2.5,
  },
  trail: {
    list: "gap-[9px] text-regular leading-none text-gray",
    chevron: "h-[16px] w-[16px]",
    stroke: 2,
  },
} as const;

export default function Breadcrumb({
  items,
  variant = "page",
}: {
  items: Crumb[];
  variant?: keyof typeof VARIANTS;
}) {
  const v = VARIANTS[variant];

  return (
    <nav aria-label="Breadcrumb" className={`flex min-w-0 items-center ${v.list}`}>
      {items.map((item, i) => (
        <span key={item.label} className={`flex min-w-0 items-center ${v.list}`}>
          {i > 0 && (
            <ChevronRight
              className={`${v.chevron} shrink-0`}
              strokeWidth={v.stroke}
              aria-hidden
            />
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
