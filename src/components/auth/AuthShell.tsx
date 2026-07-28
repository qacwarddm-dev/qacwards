import Image from "next/image";

/**
 * Page frame shared by every screen in assets/FIGMA/login (and, later,
 * register): campus photo on the left, near-white panel on the right, PUP
 * services footnote pinned to the bottom of that panel.
 *
 * Geometry is measured off the 1440x810 frame. The panel starts at x=922 and
 * its top-left corner is rounded by 100px, which is what lets the photo run on
 * underneath it; the photo's own bottom-right corner is rounded by the same
 * 100px. Those two arcs share no box, so the photo layer is a plain rectangle
 * wide enough to fill the panel's arc (1022 = 922 + 100) and the bottom-right
 * corner is carved back out with a radial mask.
 *
 * Below `lg` there is no room for a 922px photo, so the panel takes the whole
 * width and the photo drops out.
 *
 * The panel is `bg-white/90` on the client's instruction (2026-07-26). Be aware
 * it currently has no visible effect, and that is not a bug to go chasing:
 * everything behind the panel is white, so 90% white lands on 254 against 255.
 * Behind it is the page's own white plus the asset's — login-hero.jpg is
 * 2044x1498 but only its first 1844px are photograph, the frame's rounded corner
 * being baked in as a #F5F5F5 band down the right edge, so the picture stops
 * dead at exactly x=922 where the panel begins.
 *
 * Running the photo full-bleed behind the panel was tried, and it did make the
 * translucency read as frosted glass. It was reverted (client, 2026-07-26):
 * covering the full width forces the crop from 0.5 to 0.781 and the campus came
 * out visibly stretched//zoomed against the frame. This asset has no more
 * photographic width to give — a wider hero image is the only way to have both.
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
    <div className="auth-scale relative w-full overflow-hidden bg-white">
      {/* object-top so the panel's arc always meets the same image row,
          whatever height the viewport leaves us. */}
      <div className="absolute inset-y-0 left-0 hidden w-[1022px] lg:block">
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
        className="absolute bottom-0 left-[822px] hidden h-[100px] w-[100px] bg-white lg:block"
        style={{ maskImage: CARVE_MASK, WebkitMaskImage: CARVE_MASK }}
        aria-hidden
      />

      <div className="absolute inset-y-0 right-0 left-0 flex flex-col items-center bg-white/90 lg:left-[922px] lg:rounded-tl-[100px]">
        {top}
        {body}
        <AuthFootnote />
      </div>
    </div>
  );
}

const SERVICES = ["For other PUP Services, kindly visit our site ", "www.pup.edu.ph"];
const TERMS =
  "By using this service, you understood and agree to the PUP Online Service";
const COPYRIGHT =
  "© 2025 Polytechnic University of the Philippines. All Rights Reserved.";

/**
 * The two login exports disagree: the block sits 14px higher on LoginForm.png
 * than on MainLogin.png even though both frames are 809 tall and the internal
 * spacing is identical. Owner's call (2026-07-23) was to normalise on
 * MainLogin's placement rather than carry a variant into `register/`.
 */
function AuthFootnote() {
  return (
    <div className="mt-auto mb-[8px] px-4 text-center text-gray">
      {/* Sizes are the token that renders closest, not the one cap height alone
          implies: the prototype's small text is set tighter than Inter's default
          tracking, so cap height reads ~5% larger than the ink run does. r1
          measures 10.8-11.4px between the two and ships at --text-small. */}
      <p className="text-small leading-none">
        {SERVICES[0]}
        <a href="https://www.pup.edu.ph" className="text-yellow underline">
          {SERVICES[1]}
        </a>
      </p>
      <p className="mt-[8px] text-micro leading-none">{TERMS}</p>
      <p className="mt-[8px] text-micro leading-none">
        <a href="#" className="text-yellow underline">
          Terms of Use
        </a>
        <span> and </span>
        <a href="#" className="text-yellow underline">
          Privacy Statement
        </a>
      </p>
      {/* Measures ~7.5px in the frame; --text-micro (9px) is the smallest token,
          so this line ships ~20% wider than the prototype. Flagged. */}
      <p className="mt-[41px] text-micro leading-none">{COPYRIGHT}</p>
    </div>
  );
}
