import Image from "next/image";
import Link from "next/link";
import ActionMenu, { type MenuItem } from "./ActionMenu";

/**
 * Yellow folder tile in the document browser. Measured 114.5px wide; the folder
 * graphic is the client's own `assets/OTHERS/FOLDER.png` cropped to its ink, so
 * the tab/body proportions come from the source art rather than being redrawn.
 *
 * `art` swaps in a pre-composed folder image (the representative's AACCUP/COPC
 * folders ship with their seal already drawn on). `menu` draws the ⋮ overflow.
 */
export default function FolderCard({
  label,
  href,
  badge,
  badgeAlt = "",
  art,
  menu,
}: {
  label: string;
  href: string;
  /** Seal shown on the folder body — campus/college/agency logo. */
  badge?: string;
  badgeAlt?: string;
  art?: string;
  menu?: MenuItem[];
}) {
  return (
    <div className="relative w-[114.5px]">
      {menu && (
        <span className="absolute right-0 top-0 z-10">
          <ActionMenu label={label} items={menu} size={14} />
        </span>
      )}

      <Link href={href} className="block transition-opacity hover:opacity-80">
        <span className="relative block h-[91px] w-[114.5px]">
          {art ? (
            <Image src={art} alt="" width={238} height={192} className="h-full w-full object-contain" />
          ) : (
            <Image
              src="/assets/portal/folder.png"
              alt=""
              width={127}
              height={101}
              className="h-full w-full"
            />
          )}
          {!art && badge && (
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
