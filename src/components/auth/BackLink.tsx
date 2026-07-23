import { CircleChevronLeft } from "lucide-react";
import Link from "next/link";

/** Top-right "Back" affordance on assets/FIGMA/login/LoginForm.png. 18px icon,
 *  4px gap, 15px maroon label. */
export default function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[4px] text-subheading leading-none text-maroon"
    >
      <CircleChevronLeft className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      Back
    </Link>
  );
}
