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
 */
const IMG_W = 688.6;
const IMG_H = 414.5;
const IMG_LEFT = -208.4;
const IMG_TOP = -3.4;

export default function CoverCard({
  label,
  href,
  image,
}: {
  label: string;
  href: string;
  image: string;
}) {
  return (
    <Link
      href={href}
      className="block w-[351px] overflow-hidden rounded-[26px] shadow-card transition-transform hover:-translate-y-[2px]"
    >
      <span className="relative block h-[303px] w-full overflow-hidden">
        <Image
          src={image}
          alt=""
          width={2048}
          height={1233}
          className="absolute max-w-none"
          style={{ width: IMG_W, height: IMG_H, left: IMG_LEFT, top: IMG_TOP }}
        />
        <span className="absolute inset-0 bg-maroon/70" />
      </span>
      <span className="flex h-[98px] items-center justify-center bg-maroon px-[16px] text-center text-title font-bold leading-none text-white">
        {label}
      </span>
    </Link>
  );
}
