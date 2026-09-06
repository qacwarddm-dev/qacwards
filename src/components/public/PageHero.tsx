import Image from "next/image";

type Props = {
  image: string;
  /** Intrinsic pixel size of the file. `titlecard` lays the band out from the
   *  image's own aspect ratio rather than cropping it. */
  width: number;
  height: number;
  /**
   * `titlecard` — the asset is a Figma title card with the page name and the
   * PUP seal burned into the pixels (campuses, accreditation, degree-programs,
   * government-certification are all one of these). It is shown whole, at its
   * own aspect ratio, so no part of the baked type is ever sliced.
   *
   * `photo` — the asset is a real photograph with no baked type (about-us).
   * It is cropped to a wide band, since showing a 3:2 portrait group shot
   * whole would eat the entire first screen.
   */
  art: "titlecard" | "photo";
  /** Describes the picture. Must not repeat the title — a screen reader would
   *  otherwise hear the same words twice. */
  alt: string;
  eyebrow?: string;
  /**
   * The visible `<h1>`.
   *
   * On a `titlecard` this must NOT be the page name: the artwork already says
   * it, in 120px letters, and printing it again a few lines below is a
   * duplicate title. Make it the sentence the page is actually about — the
   * name is carried by the artwork, the `alt`, the `<title>` and the nav.
   */
  title: React.ReactNode;
  lede?: string;
  /** CSS object-position for the crop; `photo` only. */
  focus?: string;
  priority?: boolean;
  children?: React.ReactNode;
};

/**
 * The public site's hero: a band of artwork, then the words on solid maroon.
 *
 * **Nothing is ever laid over the picture.** Two earlier attempts did, and both
 * failed the same way (owner reports, 2026-08-21). A `bg-maroon/65` wash
 * flattened the photograph into a red field; replacing it with a bottom-anchored
 * gradient did not help, because the text block occupies the lower ~47% of the
 * band, so the scrim has to stay near-opaque across exactly the half of the
 * frame the faces are in. There is no alpha that both keeps white text at 4.5:1
 * and leaves the picture readable — the two requirements are over the same
 * pixels. Moving the words off the image resolves it instead of splitting the
 * difference: the art runs at full strength and the type sits on flat #800000,
 * which is 9.1:1, at every viewport, over any asset.
 */
export function PageHero({
  image,
  width,
  height,
  art,
  alt,
  eyebrow,
  title,
  lede,
  focus = "center",
  priority = false,
  children,
}: Props) {
  return (
    <section className="on-maroon bg-maroon text-white">
      {art === "titlecard" ? (
        /* `h-auto w-full` renders the card at its own ratio, so nothing is
           sliced. No `max-h`: clamping the height makes `object-contain`
           letterbox *sideways* instead, which put maroon pillars down both
           edges of the 2.41:1 accreditation card. `min-h` + `contain` engage
           only below ~580px, where the natural height falls under 160px and
           the burned type gets too small to read — and the letterbox they
           produce is maroon on maroon, so it is invisible. */
        <Image
          src={image}
          alt={alt}
          width={width}
          height={height}
          sizes="100vw"
          priority={priority}
          className="h-auto w-full min-h-[160px] object-contain"
        />
      ) : (
        /* Three ratios rather than one: this is a 3:2 group portrait of
           thirteen people, and a single wide crop that works at 1840 reduces
           each face to a few pixels on a phone. */
        <div className="relative aspect-[4/3] w-full sm:aspect-[21/9] lg:aspect-[3/1]">
          <Image
            src={image}
            alt={alt}
            fill
            sizes="100vw"
            priority={priority}
            style={{ objectPosition: focus }}
            className="object-cover"
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-[var(--content-max)] px-[var(--page-gutter)] pb-[var(--space-11)] pt-[var(--space-8)]">
        <div className="max-w-[52ch]">
          {eyebrow ? (
            <p className="t-eyebrow reveal flex items-center gap-3 text-yellow">
              <span aria-hidden className="h-px w-8 bg-yellow" />
              {eyebrow}
            </p>
          ) : null}
          <h1
            className="t-hero reveal mt-4 font-pup tracking-[0.01em]"
            style={{ animationDelay: "70ms" }}
          >
            {title}
          </h1>
          {lede ? (
            <p
              className="t-lead reveal mt-5 text-white/90"
              style={{ animationDelay: "140ms" }}
            >
              {lede}
            </p>
          ) : null}
          {children ? (
            <div className="reveal mt-7" style={{ animationDelay: "210ms" }}>
              {children}
            </div>
          ) : null}
        </div>
      </div>

      <span aria-hidden className="block h-[3px] w-full bg-yellow" />
    </section>
  );
}
