import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Spinner from "./Spinner";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "link"
  /** @deprecated use "primary" */
  | "solid"
  /** @deprecated use "secondary" */
  | "outline"
  /** @deprecated use "primary" + disabled, or "secondary" */
  | "muted"
  /** @deprecated case-by-case — usually "danger" */
  | "yellow";
type Size = "sm" | "md" | "lg";

/**
 * Pill button (09b §9 / 09-ui-refactor §4's rewritten `Button`).
 *
 * `primary` is the filled maroon; `secondary` is the white/maroon-bordered
 * one; `ghost` is the grey-bordered, black-text one; `danger` is a maroon
 * outline for a destructive action that is not yet confirmed (the confirm
 * itself lives in `ConfirmDialog`, which uses `danger` for its own commit
 * button); `link` renders as inline text with no pill at all.
 *
 * Old variant names (`solid`, `outline`, `muted`, `yellow`) are kept as
 * deprecated aliases for one phase so no call site had to change the moment
 * this landed — see the alias map below. `md` keeps the original 32px/12px
 * measurement across the document browser; `lg` is the 35px/15px one on
 * program_representative/07-Submissions(Phases).png; `sm` is new, for dense
 * rows (table row actions, chip-adjacent controls).
 */
const SIZES: Record<Size, string> = {
  sm: "h-[26px] gap-[4px] px-[10px] text-small",
  md: "h-[32px] gap-[6px] px-[12px] text-regular",
  lg: "h-[35px] gap-[8px] px-[16px] text-subheading",
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-maroon text-white",
  secondary: "border border-maroon bg-white text-maroon",
  ghost: "border border-[color:var(--color-gray)]/40 bg-white text-black",
  danger: "border border-maroon bg-white text-maroon",
  link: "bg-transparent text-maroon underline underline-offset-2 h-auto px-0",
  // Deprecated aliases — same visual output as before this rewrite.
  solid: "bg-maroon text-white",
  outline: "border border-maroon bg-white text-maroon",
  muted: "bg-[color:var(--color-maroon)]/50 text-white",
  yellow: "bg-yellow text-black",
};

export default function Button({
  variant = "solid",
  size = "md",
  icon: Icon,
  iconStart: IconStart,
  iconEnd: IconEnd,
  loading = false,
  full = false,
  href,
  children,
  className = "",
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  /** @deprecated use `iconStart` */
  icon?: LucideIcon;
  iconStart?: LucideIcon;
  iconEnd?: LucideIcon;
  /** Spinner + `aria-busy` + disabled. */
  loading?: boolean;
  full?: boolean;
  /** When set the pill navigates — it renders a Next `Link` instead of a
   *  `<button>` (the "New" button on Assignment opens the create screen). */
  href?: string;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const Start = IconStart ?? Icon;
  const isLink = variant === "link";
  const disabled = rest.disabled || loading;
  // B2 brought the first buttons in the portal that can be busy or unavailable
  // (avatar upload, password change). Half strength plus a blocked cursor is the
  // same treatment the auth buttons already use for their disabled state, so the
  // two halves of the product read the same.
  const disabledLook = disabled ? "opacity-50 cursor-not-allowed" : "";
  const shape = isLink ? "" : "rounded-full";
  const sizeCls = isLink ? "" : SIZES[size];
  const cls = `inline-flex shrink-0 items-center justify-center font-semibold leading-none ${shape} ${sizeCls} ${VARIANTS[variant]} ${disabledLook} ${full ? "w-full" : ""} ${className}`;
  const inner = (
    <>
      {loading ? (
        <Spinner size={size === "lg" ? 20 : 16} label="Loading" />
      ) : (
        Start && <Start className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden />
      )}
      {children}
      {!loading && IconEnd && <IconEnd className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden />}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={`${cls} transition-opacity hover:opacity-90`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cls}
      aria-busy={loading || undefined}
      disabled={disabled}
      {...rest}
    >
      {inner}
    </button>
  );
}
