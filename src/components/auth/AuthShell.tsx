import Image from "next/image";
import Link from "next/link";
import AuthFootnote from "./AuthFootnote";

/**
 * Page frame shared by every login and register screen: campus photograph on one
 * side, white panel carrying the card on the other, PUP services footnote at the
 * foot of that panel.
 *
 * ## What changed in the 2026-08-21 redesign, and what deliberately did not
 *
 * **Kept, because it is the brand:** the photo/panel split, the panel's opaque
 * white fill, the arc where the two meet, and the rule that *nothing is ever laid
 * over the hero art*. Both overlay attempts on the public site were rejected by
 * the owner and the same reasoning applies here — this photograph is people on a
 * campus, and no scrim alpha both holds white text at 4.5:1 and leaves the
 * picture readable. The words live on the white panel.
 *
 * **Replaced:** the geometry. The old frame was an absolutely-positioned
 * transcription of a 1440x810 Figma export — the panel at `left: 64.028%`, the
 * photo box at `70.972%`, a 100px arc, and every measurement inside the panel a
 * fixed px that only resolved correctly at exactly 1440. Two scale factors were
 * bolted on to cope with anything else (`--auth-scale`, then `--auth-zoom`), and
 * a ResizeObserver loop on top of those to stop the card colliding with the
 * footnote. All of it is gone. See the note beside `--auth-gutter` in globals.css
 * for why `zoom` in particular had to go.
 *
 * It is now a two-column grid. The photo takes the free track; the panel takes a
 * `minmax()` track and is pulled left by exactly the arc radius, so it overhangs
 * the photograph by the same amount its corner curves — which is what the 100px
 * overlap in the original export was for. Overlap and radius can no longer
 * disagree, because they are the same custom property.
 *
 * **Below `lg`** the split is not a split at all any more. It used to drop the
 * photo entirely and leave a 330px card marooned in a full-bleed white panel,
 * which is the state most people on a phone actually saw. The photograph now
 * becomes a banner and the panel rides up over it with the same arc applied
 * across its whole top edge, so the shape language survives the breakpoint
 * instead of being abandoned at it.
 *
 * `object-position: top` on the image is load-bearing at every width: it keeps
 * the arc meeting the same row of the photograph whatever height the viewport
 * leaves, and it keeps faces out of the crop's bottom edge on the mobile banner.
 */

/** White everywhere except within one arc-radius of the box's top-left corner —
 *  the exact complement of a rounded corner, which CSS radii cannot express.
 *  Draws the photograph's bottom-right corner where it meets the panel. */
const CARVE_MASK =
  "radial-gradient(circle var(--auth-arc) at 0 0, transparent 99.5%, #000 100%)";

/** Masthead worn by every auth screen. The seal used to appear on the role
 *  picker alone, so seven of the eight screens in this flow carried no mark at
 *  all — a password field on a bare white page with no indication whose it is.
 *  It is a link, because on these screens it is the only route back to the site. */
function AuthMasthead() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)]"
    >
      <Image
        src="/assets/logos/pup.png"
        alt=""
        width={380}
        height={380}
        className="h-[40px] w-[40px] shrink-0"
      />
      <span className="min-w-0">
        <span className="t-h3 block text-maroon transition-opacity group-hover:opacity-70">
          Quality Assurance Center
        </span>
        <span className="t-meta block text-black/70">
          Polytechnic University of the Philippines
        </span>
      </span>
    </Link>
  );
}

export default function AuthShell({
  children,
  topRight,
}: {
  children: React.ReactNode;
  /** Slot on the masthead row, flush right — the Back link. */
  topRight?: React.ReactNode;
}) {
  return (
    // `lg:flex-none` is load-bearing next to `lg:h-[100dvh]`. This element is a
    // flex item of the layout's `<main>`, and `flex-1` resolves to
    // `flex: 1 1 0%` — in a column flex container the flex algorithm decides the
    // main size, so it *overrides* the height and the shell simply grew to its
    // content. That made `lg:overflow-hidden` clip a page that was never
    // scrollable and `lg:overflow-y-auto` on the panel a no-op: at 1280x560 the
    // register form's submit button sat 315px below the fold with no way to
    // reach it. Cancelling the flex sizing at `lg` lets the declared height win,
    // which is what gives the panel a fixed box to scroll inside.
    <div className="relative flex min-h-[100dvh] flex-1 flex-col bg-white lg:grid lg:h-[100dvh] lg:min-h-0 lg:flex-none lg:grid-cols-[1fr_minmax(380px,37%)] lg:overflow-hidden">
      {/* Photograph. A banner above the panel on small screens, the left track
          on large ones. `aria-hidden` by way of an empty alt: it is atmosphere,
          and describing "students outside a building" to a screen reader on a
          login form is noise, not information. */}
      <div className="relative h-[clamp(140px,26vh,260px)] w-full overflow-hidden lg:h-full">
        {/* `w-[111%]` + `object-left-top` + the wrapper's clip are one fix, not
            three tweaks: login-hero.jpg is 2044px wide but only its first
            ~1844px are photograph. The remaining ~200px is a flat #F5F5F5 band
            — the Figma frame's own rounded corner, baked into the export. The
            old layout hid it by parking it under the opaque panel, which worked
            only at the frame's aspect ratio; at any other one it surfaced as a
            grey strip down the right edge, which is exactly what a phone or a
            tablet got, because below `lg` there was no panel over it at all.
            Widening the box by 1/(1-200/2044) and anchoring the cover crop to
            the left puts the band past the clip at every viewport. */}
        <Image
          src="/assets/imagery/login-hero.jpg"
          alt=""
          width={2044}
          height={1498}
          priority
          sizes="(min-width: 1024px) 70vw, 111vw"
          className="h-full w-[111%] max-w-none object-cover object-left-top"
        />
      </div>

      <div className="relative z-10 -mt-[var(--auth-arc)] flex min-h-0 flex-1 flex-col rounded-t-[var(--auth-arc)] bg-white lg:mt-0 lg:-ml-[var(--auth-arc)] lg:rounded-t-none lg:rounded-tl-[var(--auth-arc)] lg:overflow-y-auto">
        {/* The photograph's bottom-right corner, drawn from inside the panel so
            it tracks the panel's own left edge rather than a percentage that has
            to be kept in sync with it. Large screens only — on the banner layout
            the photo has no corner there to round. */}
        <div
          className="absolute bottom-0 left-0 hidden h-[var(--auth-arc)] w-[var(--auth-arc)] -translate-x-full bg-white lg:block"
          style={{ maskImage: CARVE_MASK, WebkitMaskImage: CARVE_MASK }}
          aria-hidden
        />

        <div className="flex min-h-full flex-1 flex-col px-[var(--auth-gutter)] pt-[var(--auth-gutter)] pb-[var(--space-4)]">
          <div className="flex items-start justify-between gap-[var(--space-4)]">
            <AuthMasthead />
            {topRight}
          </div>

          {/* `my-auto` centres the card in whatever room is left and yields it
              the moment the content is taller than the panel, at which point the
              panel scrolls. That single line is what the ResizeObserver fitting
              loop existed to approximate. */}
          <div className="flex w-full flex-col items-center justify-center py-[clamp(20px,3.5vh,44px)] lg:my-auto">
            {children}
          </div>

          <AuthFootnote />
        </div>
      </div>
    </div>
  );
}
