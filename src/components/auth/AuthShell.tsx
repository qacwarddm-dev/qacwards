import Image from "next/image";
import AuthFootnote from "./AuthFootnote";

/**
 * Page frame shared by every screen in assets/FIGMA/login (and, later,
 * register): campus photo on the left, near-white panel on the right, PUP
 * services footnote pinned to the bottom of that panel.
 *
 * Geometry is measured off the 1440x810 frame: the panel starts at x=922 and the
 * photo layer runs to 1022, 100px further, so the photo passes under the panel's
 * arc. Its top-left corner is rounded by 100px, which is what lets the photo run
 * on underneath; the photo's own bottom-right corner is rounded by the same
 * 100px. Those two arcs share no box, so the photo layer is a plain rectangle
 * wide enough to fill the panel's arc and the bottom-right corner is carved back
 * out with a radial mask.
 *
 * **Those two edges are ratios of the frame width, not fixed px** — 922/1440 and
 * 1022/1440. Held at fixed px they only read correctly at exactly 1440: the panel
 * is a fixed 518px slice of the frame (36%), but on a 1854px monitor a fixed
 * 922px offset left it 932px wide, half the screen, which the owner reported as
 * far too much white (2026-08-20). As percentages the split holds its measured
 * proportion at every width, and at 1440 it resolves back to exactly 922/1022.
 *
 * This also repairs a range that was simply broken: between `lg` (1024) and about
 * 1350, a fixed 922px offset left a panel 102-430px wide with a 330px card and a
 * ~436px footnote inside it. Proportionally the panel is never narrower than 36%
 * of the viewport, so the card always has room.
 *
 * The 100px corner radius stays fixed rather than scaling — it is a corner
 * treatment, not a layout dimension, and a radius that balloons on a wide monitor
 * reads as a different shape. The photo/panel overlap does scale, so above 1440
 * more of the photo sits under the panel than the arc strictly needs. That is
 * invisible: the panel is opaque.
 *
 * Below `lg` there is no room for the split at all, so the panel takes the whole
 * width and the photo drops out.
 *
 * The panel is opaque `bg-white`. It was `bg-white/90` on the client's
 * instruction (2026-07-26), on the understanding — written into this comment —
 * that the translucency had no visible effect because everything behind the
 * panel was white: login-hero.jpg is 2044x1498 but only its first 1844px are
 * photograph, the frame's rounded corner being baked in as a #F5F5F5 band down
 * the right edge, which was assumed to sit under the panel's 100px overlap.
 *
 * **That assumption only holds at the frame's aspect ratio.** The photo box is a
 * fixed 1022px wide, so `object-cover` scales the asset to fill the height and
 * crops horizontally — and the taller the viewport, the more it eats from the
 * sides. At the 1440x810 frame, source columns 77-1967 are visible and 123px of
 * the band survives behind the panel. At 1854x927 the visible range is 196-1848:
 * just 4px of band, leaving ~158 source columns of real photograph under the
 * panel, which 90% white rendered as a washed strip down the arc (owner spotted
 * it, 2026-08-20).
 *
 * So the fill is now opaque, which is what the client actually saw when they
 * approved the translucency. If frosted glass is ever wanted deliberately, it
 * needs an asset with more photographic width — not a lower alpha.
 *
 * Running the photo full-bleed behind the panel was tried, and it did make the
 * translucency read as frosted glass. It was reverted (client, 2026-07-26):
 * covering the full width forces the crop from 0.5 to 0.781 and the campus came
 * out visibly stretched//zoomed against the frame. This asset has no more
 * photographic width to give — a wider hero image is the only way to have both.
 *
 * `--auth-scale` (the whole-shell zoom this used before Phase 6) is gone —
 * see globals.css. It floored at 1 below 1440, so the `lg:hidden` photo /
 * full-width-panel fallback below already carried every width narrower than
 * that unchanged; above 1440 the shell now renders at its measured size
 * instead of growing, which only affects wide monitors.
 *
 * Its removal did leave the card stranded at 382px in a panel that keeps
 * growing, which read as far too small (owner, 2026-08-20). `--auth-zoom`
 * is the bounded replacement, applied to the panel's contents only — the
 * geometry above (photo width, panel offset, both arcs) stays measured and
 * unscaled, so none of the crop trade-offs described above come back.
 */

/** White everywhere except within 100px of the box's top-left corner — the
 *  exact complement of a rounded corner, which CSS radii cannot express. */
const CARVE_MASK = "radial-gradient(circle 100px at 0 0, transparent 99.5%, #000 100%)";

export default function AuthShell({
  children,
  topRight,
  align = "top",
}: {
  children: React.ReactNode;
  /** Slot above the card, flush to the panel's right edge (the Back link). */
  topRight?: React.ReactNode;
  /**
   * `top` is the login frames: the card hangs from the panel top on its own
   * margin. `center` is the register frames, where the card is centred in the
   * space above the footnote instead — measured card centres are y383-393 across
   * all five exports while the cards themselves range 420-592 tall, so the
   * designer grew them about a fixed middle, not a fixed top. Centring is what
   * keeps the tall Program Representative state off the footnote.
   */
  align?: "top" | "center";
}) {
  const top = topRight ? (
    <div className="mt-[27px] flex w-full justify-end pr-[42px]">{topRight}</div>
  ) : null;

  // No padding here on purpose: this box is what AuthCard measures itself
  // against, and its own clearance from the footnote is applied in that
  // calculation instead, where it only binds when the card is actually tight.
  const body =
    align === "center" ? (
      <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-center">
        {children}
      </div>
    ) : (
      children
    );

  return (
    <div className="relative w-full flex-1 overflow-hidden bg-white">
      {/* object-top so the panel's arc always meets the same image row,
          whatever height the viewport leaves us. */}
      <div className="absolute inset-y-0 left-0 hidden w-[70.972%] lg:block">
        <Image
          src="/assets/imagery/login-hero.jpg"
          alt=""
          width={2044}
          height={1498}
          priority
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div
        className="absolute bottom-0 left-[calc(64.028%-100px)] hidden h-[100px] w-[100px] bg-white lg:block"
        style={{ maskImage: CARVE_MASK, WebkitMaskImage: CARVE_MASK }}
        aria-hidden
      />

      <div className="absolute inset-y-0 right-0 left-0 bg-white lg:left-[64.028%] lg:rounded-tl-[100px]">
        {/* The zoom sits on this inner box, not on the panel itself: the panel
            is positioned by `left-[922px]`, and zooming it would scale that
            offset and pull it off the photo's arc. Everything inside is a fixed
            px measured off the 1440 frame, so one factor keeps every proportion
            while making the card legible on a wide monitor — see --auth-zoom in
            globals.css, and `useFitToRoom` in AuthCard, which already divides
            this factor back out when it fits the register card to the room. */}
        <div
          className="absolute inset-0 flex flex-col items-center"
          style={{ zoom: "var(--auth-zoom)" }}
        >
          {top}
          {body}
          <AuthFootnote />
        </div>
      </div>
    </div>
  );
}

