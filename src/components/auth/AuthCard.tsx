/**
 * The card sitting on the auth panel.
 *
 * ## What the 2026-08-21 redesign removed
 *
 * **`useFitToRoom` and `REGISTER_ZOOM` are gone.** The card used to carry a
 * `zoom` that a `useLayoutEffect` + `ResizeObserver` pair recomputed on every
 * resize, dividing an ancestor `zoom` back out of `getBoundingClientRect()` so
 * the card could be shrunk until it stopped colliding with the footnote. All of
 * that existed because the panel magnified its contents instead of laying them
 * out; the shell now lays them out and overflows into a scroll, so a card that
 * is too tall is simply scrolled to. Roughly 90 lines of measurement code and
 * its entire class of convergence bugs went with it.
 *
 * **The two-tone register card is gone.** Every register frame drew a 63px
 * `--color-surface` band behind the title with a white body beneath it — two
 * greys stacked, which on screen read as a mis-cropped screenshot rather than a
 * deliberate header. The header is now part of the card: an accent rule, the
 * step indicator, the title. One surface.
 *
 * **The nested white sub-card inside the login cards is gone**, for the same
 * reason: `--color-surface` card wrapping a white card wrapping the fields is
 * three boxes to say one thing.
 *
 * **Fixed widths are gone.** 330px (login) and 382px (register) are now ceilings
 * on `--auth-card` / `--auth-card-wide`, which fill the panel's gutter on a
 * phone. The register form's own content is what justifies the wider ceiling —
 * the Full Name row needs three fields on one line above `sm`.
 *
 * ## The step indicator
 *
 * New, and the largest usability gap in the flow: registration is four screens
 * (account -> verify -> password -> profile) and none of them told you which one
 * you were on or how many were left. It is an `<ol>` of segments with the
 * position stated in text for assistive technology, not colour alone.
 */

const WIDTH = {
  picker: "max-w-[var(--auth-card)]",
  form: "max-w-[var(--auth-card)]",
  register: "max-w-[var(--auth-card-wide)]",
} as const;

export type AuthStep = {
  /** 1-based. */
  current: number;
  total: number;
};

function AuthStepper({ current, total }: AuthStep) {
  return (
    <div className="flex items-center gap-[var(--space-3)]">
      <ol className="flex flex-1 items-center gap-[6px]" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={`h-[4px] flex-1 rounded-full transition-colors duration-[var(--motion-base)] ${
              i < current ? "bg-maroon" : "bg-[var(--hairline)]"
            }`}
          />
        ))}
      </ol>
      <p className="t-meta shrink-0 text-black/70">
        Step {current} of {total}
      </p>
    </div>
  );
}

export default function AuthCard({
  variant = "picker",
  title,
  subtitle,
  step,
  children,
}: {
  variant?: "picker" | "form" | "register";
  /** Card heading. Rendered as the screen's `<h1>` when set. */
  title?: string;
  /** One line of orienting copy under the title. */
  subtitle?: string;
  /** Register flow only — draws the progress indicator above the title. */
  step?: AuthStep;
  children: React.ReactNode;
}) {
  const hasHeader = Boolean(title || step);

  return (
    <section
      className={`w-full ${WIDTH[variant]} rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-white p-[clamp(20px,4vw,32px)] shadow-[var(--elev-2)]`}
    >
      {hasHeader && (
        <header className="mb-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
          {step && <AuthStepper {...step} />}
          {title && (
            <div className="flex flex-col gap-[var(--space-2)]">
              {/* A short maroon rule instead of the old surface band: it marks
                  the header as the header without a second background colour.
                  Suppressed when a stepper is present — two maroon bars stacked
                  four pixels apart read as one broken progress track. */}
              {!step && (
                <span
                  aria-hidden
                  className="h-[3px] w-[36px] rounded-full bg-maroon"
                />
              )}
              <h1 className="t-section text-balance text-maroon">{title}</h1>
              {subtitle && (
                <p className="t-sm text-pretty text-black/70">{subtitle}</p>
              )}
            </div>
          )}
        </header>
      )}
      {children}
    </section>
  );
}
