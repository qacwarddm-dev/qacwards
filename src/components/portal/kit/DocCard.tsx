import Image from "next/image";
import Link from "next/link";
import ActionMenu, { type MenuItem } from "./ActionMenu";

/**
 * A document tile on the Program Representative Documents panel: grey card,
 * PDF badge + truncated title + overflow menu, then a white page preview.
 * 194x167 on a 4-up grid with a 27px gutter.
 *
 * `href` makes the tile open its document. B6 added it, pointing at
 * `/api/documents/download` — every bucket is private, so a tile can never carry
 * a direct object URL; it carries a row id and the route mints a short-lived
 * signed URL after RLS has allowed the row to be read.
 *
 * `menu` draws the ⋮ overflow; omit it for read-only tiles (a representative's
 * Templates and Common Documents). The link is an overlay rather than a wrapper
 * so the menu button is never nested inside an anchor.
 */
export default function DocCard({
  title,
  href,
  menu,
}: {
  title: string;
  href?: string;
  menu?: MenuItem[];
}) {
  return (
    <article className="relative h-[167px] rounded-[14px] bg-[color:var(--color-gray)]/12 px-[12px] pt-[10px] transition-opacity has-[>a:hover]:opacity-90">
      {href && (
        <Link href={href} aria-label={title} className="absolute inset-0 rounded-[14px]" />
      )}
      <div className="flex h-[23px] items-center">
        <span className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-[3px] bg-[color:var(--color-pdf)] text-[5px] font-bold leading-none text-white">
          PDF
        </span>
        <h3 className="ml-[10px] min-w-0 flex-1 truncate text-subheading leading-none text-black">
          {title}
        </h3>
        {menu && (
          <span className="relative z-10 shrink-0">
            <ActionMenu label={title} items={menu} />
          </span>
        )}
      </div>

      <div className="mt-[10px] h-[110px] overflow-hidden bg-white">
        <Image
          src="/assets/portal/doc-thumb-sample.png"
          alt=""
          width={474}
          height={298}
          className="h-full w-full object-cover object-top"
        />
      </div>
    </article>
  );
}
