import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ViewAllLink({ href, scroll }: { href: string; scroll?: boolean }) {
  return (
    <Link
      href={href}
      scroll={scroll}
      className="flex items-center gap-[4px] text-regular font-semibold leading-none text-maroon transition-opacity hover:opacity-70"
    >
      View All
      <ChevronRight className="h-[14px] w-[14px]" strokeWidth={2.5} aria-hidden />
    </Link>
  );
}
