import { CircleChevronLeft } from "lucide-react";
import Link from "next/link";

/** "‹ Back" affordance at the top-left of every document-browser screen. */
export default function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[10px] text-maroon transition-opacity hover:opacity-70"
    >
      <CircleChevronLeft className="h-[20px] w-[20px]" strokeWidth={1.5} aria-hidden />
      <span className="text-subheading leading-none">Back</span>
    </Link>
  );
}
