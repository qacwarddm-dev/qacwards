import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * The "back to where you came from" affordance on the auth panel's top row.
 *
 * 2026-08-21: was an 18px icon and a 15px word with no padding, giving a target
 * about 60x18 — under the WCAG 2.5.5 floor in one dimension and right on the
 * edge of unusable on a phone. It is now a real 44px-tall control with a hover
 * state, and the destination is named in its accessible label, because eight
 * screens each offering an unqualified "Back" tells a screen-reader user
 * nothing about where it goes.
 */
export default function BackLink({
  href,
  label = "Back",
  destination,
}: {
  href: string;
  label?: string;
  /** Where this goes, e.g. "sign in". Read out as "Back to sign in". */
  destination?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={destination ? `${label} to ${destination}` : label}
      className="t-label inline-flex min-h-[var(--auth-control-h)] shrink-0 items-center gap-[var(--space-2)] rounded-[var(--radius-full)] px-[var(--space-3)] text-maroon transition-colors duration-[var(--motion-fast)] hover:bg-[var(--tint-maroon)]"
    >
      <ArrowLeft className="h-[16px] w-[16px] shrink-0" strokeWidth={2.5} aria-hidden />
      {label}
    </Link>
  );
}
