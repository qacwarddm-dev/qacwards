import { Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Auth-screen button.
 *
 * ## What the 2026-08-21 redesign changed
 *
 * **Fixed sizes are gone.** The frames drew four: 208x35, 150x40, 104x40 and
 * 191x35. Three of the four are under the 44px WCAG 2.5.5 target floor, the
 * 104px and 150px pills were the *same* control on consecutive register steps
 * (the notes already flagged that as a likely design slip), and a fixed-width
 * button truncates the moment its label changes to "Sending code…". Buttons now
 * size to their label with a 44px floor, and `block` fills the column — which is
 * what a primary action on a 360px phone should do.
 *
 * **White on yellow is gone.** `bg-yellow text-white` measures about 1.9:1
 * (#EFBF04 is a light colour), so the role picker's three primary buttons failed
 * AA outright. Yellow now carries black text at ~11:1. No palette change: both
 * colours are still the frozen tokens, they are just paired the right way round.
 *
 * **Disabled is a last resort.** The forms used to ship their submit disabled
 * until every field passed, which hides *why* the button will not work and
 * leaves keyboard and screen-reader users with an inert control and no message.
 * The forms now submit and report what is missing. `loading` is what this
 * component is normally in when it cannot be pressed, and it says so with
 * `aria-busy` and a live label rather than by going grey.
 */

type Tone = "maroon" | "yellow" | "outline" | "ghost";
type Size = "md" | "lg";

const TONE: Record<Tone, string> = {
  maroon:
    "bg-maroon text-white hover:bg-[color-mix(in_srgb,var(--color-maroon)_88%,black)]",
  yellow:
    "bg-yellow text-black hover:bg-[color-mix(in_srgb,var(--color-yellow)_88%,black)]",
  outline:
    "border border-[var(--hairline-strong)] bg-white text-black hover:border-maroon hover:bg-[var(--tint-maroon)]",
  ghost: "bg-transparent text-maroon hover:bg-[var(--tint-maroon)]",
};

const SIZE: Record<Size, string> = {
  md: "min-h-[var(--auth-control-h)] px-[var(--space-5)] t-label",
  lg: "min-h-[48px] px-[var(--space-6)] t-body-strong",
};

export default function AuthButton({
  tone = "maroon",
  size = "md",
  href,
  block,
  loading,
  disabled,
  className = "",
  children,
  ...rest
}: {
  tone?: Tone;
  size?: Size;
  /** Renders a link when set, a button otherwise. */
  href?: string;
  /** Fill the available width. The default on narrow viewports for primaries. */
  block?: boolean;
  /** In-flight. Shows a spinner, blocks the press, and announces itself. */
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inert = disabled || loading;

  const look = [
    "relative inline-flex items-center justify-center gap-[var(--space-2)]",
    "rounded-[var(--radius-full)] text-center leading-none",
    "transition-[background-color,border-color,color,transform] duration-[var(--motion-fast)] ease-[var(--ease-out)]",
    "active:scale-[0.98]",
    SIZE[size],
    block ? "w-full" : "",
    TONE[tone],
    // Kept at 60% of the real tone rather than swapped for a grey fill: the
    // frames' disabled state was maroon-at-50% with white text (about 2.9:1),
    // which is a legible-looking button you cannot press. Dimming the real
    // colour keeps the affordance recognisable and the label readable.
    inert ? "cursor-not-allowed opacity-60" : "",
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={look}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={inert}
      aria-busy={loading || undefined}
      className={look}
      {...rest}
    >
      {loading && (
        <Loader2
          className="h-[16px] w-[16px] shrink-0 animate-spin"
          strokeWidth={2.5}
          aria-hidden
        />
      )}
      {children}
    </button>
  );
}
