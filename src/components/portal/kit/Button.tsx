import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Variant = "solid" | "outline" | "muted";
type Size = "md" | "lg";

/**
 * Pill button. `solid` is the filled maroon (Sort, New on Assignment/Reports,
 * Save Changes); `outline` is the white/maroon-bordered one (New in the
 * document browser); `muted` is the half-strength maroon the Submissions frames
 * use for Next / Submit.
 *
 * `md` is the 32px/12px button measured across the document browser; `lg` is
 * the 35px/15px one on program_representative/07-Submissions(Phases).png.
 */
const SIZES: Record<Size, string> = {
  md: "h-[32px] gap-[6px] px-[12px] text-regular",
  lg: "h-[35px] gap-[8px] px-[16px] text-subheading",
};

const VARIANTS: Record<Variant, string> = {
  solid: "bg-maroon text-white",
  outline: "border border-maroon bg-white text-maroon",
  muted: "bg-[color:var(--color-maroon)]/50 text-white",
};

export default function Button({
  variant = "solid",
  size = "md",
  icon: Icon,
  href,
  children,
  className = "",
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  /** When set the pill navigates — it renders a Next `Link` instead of a
   *  `<button>` (the "New" button on Assignment opens the create screen). */
  href?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
  const inner = (
    <>
      {Icon && <Icon className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${cls} transition-opacity hover:opacity-90`}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}
