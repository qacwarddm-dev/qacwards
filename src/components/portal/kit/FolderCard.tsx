import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * Yellow folder tile in the document browser. Measured 114.5px wide; the folder
 * graphic is the client's own `assets/OTHERS/FOLDER.png` cropped to its ink, so
 * the tab/body proportions come from the source art rather than being redrawn.
 */
export default function FolderCard({
  label,
  href,
  badge,
  badgeAlt = "",
}: {
  label: string;
  href: string;
  /** Seal shown on the folder body — campus/college/agency logo. */
  badge?: string;
  badgeAlt?: string;
}) {
  return (
    <div className="relative w-[114.5px]">
      <button
        type="button"
        aria-label={`More actions for ${label}`}
        className="absolute right-0 top-0 z-10 text-maroon transition-opacity hover:opacity-70"
      >
        <EllipsisVertical className="h-[14px] w-[14px]" strokeWidth={2.5} aria-hidden />
      </button>

      <Link href={href} className="block">
        <span className="relative block h-[91px] w-[114.5px]">
          <Image
            src="/assets/portal/folder.png"
            alt=""
            width={127}
            height={101}
            className="h-full w-full"
          />
          {badge && (
            <Image
              src={badge}
              alt={badgeAlt}
              width={208}
              height={208}
              // Centred on the folder body, which starts 28.7% down the graphic.
              className="absolute left-1/2 top-[59%] h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 object-contain"
            />
          )}
        </span>

        <span className="mt-[7px] block text-center text-regular leading-[1.2] text-black">
          {label}
        </span>
      </Link>
    </div>
  );
}
