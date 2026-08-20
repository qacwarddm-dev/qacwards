import Image from "next/image";
import Link from "next/link";

/**
 * Large photo tile with a maroon caption bar — the "MAIN CAMPUS" / "CAMPUSES"
 * entry points on the Documents landing screen.
 *
 * The crop is not `object-cover`: the prototype zooms ~1.45x past cover and
 * sits high in the frame. Recovered by correlating the frame's card against
 * `assets/OTHERS/DOCUMENTS.jpg` — visible source box x620–1664, y10–916 of
 * 2048x1233, which is why the image is oversized and offset rather than fitted.
 * The 70% maroon veil over it was matched channel-by-channel.
 *
 * `preview` turns on the hover state (…-HoverState frames): the maroon veil and
 * caption fade off to reveal the photo in colour, and a dark panel rises from
 * the bottom with a comma-list of what is inside plus a "See More" button.
 *
 * `variant="level"` is the narrower, taller card the Documents Templates tab
 * uses for its three level-selector tiles (02-Documents.png / 02.01-
 * HoverState.png) — same hover mechanics, but a plain `object-cover` crop
 * instead of the landing card's hand-measured offset, since it reuses the one
 * building photo asset rather than reproducing a distinct crop per card.
 */
const IMG_W = 688.6;
const IMG_H = 414.5;
const IMG_LEFT = -208.4;
const IMG_TOP = -3.4;

export default function CoverCard({
  label,
  href,
  image,
  preview,
  variant = "landing",
  ctaLabel = "See More",
}: {
  label: string;
  href: string;
  image: string;
  /** Preview panel content; when set, the card reveals a hover panel. */
  preview?: React.ReactNode;
  variant?: "landing" | "level";
  /** Button label inside the hover panel. */
  ctaLabel?: string;
}) {
  const level = variant === "level";

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden shadow-card transition-transform hover:-translate-y-[2px] ${
        level ? "w-[250px] rounded-[18px]" : "w-[351px] rounded-[26px]"
      }`}
    >
      <span className={`relative block w-full overflow-hidden ${level ? "h-[330px]" : "h-[303px]"}`}>
        {level ? (
          <Image src={image} alt="" fill className="object-cover object-top" />
        ) : (
          <Image
            src={image}
            alt=""
            width={2048}
            height={1233}
            className="absolute max-w-none"
            style={{ width: IMG_W, height: IMG_H, left: IMG_LEFT, top: IMG_TOP }}
          />
        )}
        <span className="absolute inset-0 bg-maroon/70 transition-opacity duration-200 group-hover:opacity-0" />
      </span>
      <span
        className={`flex items-center justify-center bg-maroon px-[16px] text-center text-title font-bold leading-none text-white transition-opacity duration-200 group-hover:opacity-0 ${
          level ? "h-[85px]" : "h-[98px]"
        }`}
      >
        {label}
      </span>

      {preview && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full flex-col items-center rounded-t-[24px] bg-gradient-to-b from-black/[0.72] to-black/[0.92] px-[24px] pt-[24px] pb-[20px] transition-transform duration-500 ease-out group-hover:translate-y-0">
          <span className="text-center text-regular leading-[15px] text-white">
            {preview}
          </span>
          <span className="mt-[20px] flex h-[34px] w-full items-center justify-center border border-white text-regular text-white">
            {ctaLabel}
          </span>
        </span>
      )}
    </Link>
  );
}
