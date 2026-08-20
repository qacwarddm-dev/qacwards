import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Variant = "solid" | "outline" | "muted" | "yellow" | "ghost";
type Size = "md" | "lg";

/**
 * Pill button. `solid` is the filled maroon (Sort, New on Assignment/Reports,
 * Change Password); `outline` is the white/maroon-bordered one (New in the
 * document browser, Reset on Profile); `muted` is the half-strength maroon the
 * Submissions frames use for Next / Submit; `yellow` is the accent token, so
 * far only Profile's Remove Photo — a destructive action the frame deliberately
 * does not draw in maroon; `ghost` is the grey-bordered, black-text Cancel on
 * the Accept Confirmation and Add Document modals.
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
  yellow: "bg-yellow text-white",
  ghost: "border border-[color:var(--color-gray)]/40 bg-white text-black",
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
  // B2 brought the first buttons in the portal that can be busy or unavailable
  // (avatar upload, password change). Half strength plus a blocked cursor is the
  // same treatment the auth buttons already use for their disabled state, so the
  // two halves of the product read the same.
  const disabledLook = rest.disabled ? "opacity-50 cursor-not-allowed" : "";
  const cls = `flex shrink-0 items-center justify-center rounded-full font-semibold leading-none ${SIZES[size]} ${VARIANTS[variant]} ${disabledLook} ${className}`;
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
