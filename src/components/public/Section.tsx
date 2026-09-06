type Tone = "white" | "tint" | "maroon";

type Props = {
  id?: string;
  tone?: Tone;
  /** Drop the max-width container when a child needs the full band. */
  bleed?: boolean;
  className?: string;
  children: React.ReactNode;
};

const TONE: Record<Tone, string> = {
  white: "bg-white text-black",
  // color-mix of --color-yellow, replacing the un-tokenised #FFF8DC the About
  // page shipped with a "flagged for the client" comment.
  tint: "bg-[var(--tint-yellow)] text-black",
  maroon: "on-maroon bg-maroon text-white",
};

/**
 * One vertical rhythm for the whole public site. Before this, every page picked
 * its own: `py-16`, `pb-28 pt-11`, `pt-32 pb-40`, `py-20`. `--section-y` is a
 * clamp, so the spacing that reads as generous at 1440 does not swallow a
 * phone screen.
 */
export function Section({
  id,
  tone = "white",
  bleed = false,
  className = "",
  children,
}: Props) {
  return (
    <section
      id={id}
      className={`py-[var(--section-y)] ${TONE[tone]} ${className}`}
    >
      <div
        className={
          bleed
            ? ""
            : "mx-auto w-full max-w-[var(--content-max)] px-[var(--page-gutter)]"
        }
      >
        {children}
      </div>
    </section>
  );
}
