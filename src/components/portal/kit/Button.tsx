import type { LucideIcon } from "lucide-react";

type Variant = "solid" | "outline";

/**
 * Pill button. `solid` is the filled maroon (Sort, New on Assignment/Reports,
 * Save Changes); `outline` is the white/maroon-bordered one (New in the
 * document browser). Measured 32px tall, fully rounded.
 */
export default function Button({
  variant = "solid",
  icon: Icon,
  children,
  className = "",
  ...rest
}: {
  variant?: Variant;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const look =
    variant === "solid"
      ? "bg-maroon text-white"
      : "border border-maroon bg-white text-maroon";

  return (
    <button
      type="button"
      className={`flex h-[32px] shrink-0 items-center justify-center gap-[6px] rounded-full px-[12px] text-regular font-semibold leading-none ${look} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}
