import { CircleChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * "‹ Back" affordance at the top-left of every document-browser screen.
 *
 * `to` names the destination — "Back to **Levels**" on the Submissions frames,
 * where the destination is set in semibold against a regular "Back to".
 */
export default function BackLink({ href, to }: { href: string; to?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[10px] text-maroon transition-opacity hover:opacity-70"
    >
      <CircleChevronLeft className="h-[20px] w-[20px]" strokeWidth={1.5} aria-hidden />
      <span className="text-subheading leading-none">
        {to ? (
          <>
            Back to <span className="font-semibold">{to}</span>
          </>
        ) : (
          "Back"
        )}
      </span>
    </Link>
  );
}
