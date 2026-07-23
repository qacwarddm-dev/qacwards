import { EllipsisVertical } from "lucide-react";
import Image from "next/image";

/**
 * Document tile: grey shell, file-type chip, truncated name, kebab menu and a
 * white page preview. Matches the sample PDF card in the prototype.
 */
export default function FileCard({
  name,
  thumbnail,
  kind = "PDF",
}: {
  name: string;
  thumbnail: string;
  kind?: string;
}) {
  return (
    <figure className="w-[262px] rounded-[14px] bg-[color:var(--color-gray)]/15 p-[14px]">
      <figcaption className="flex items-center gap-[10px]">
        <span className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded bg-alert text-[7px] font-bold leading-none text-white">
          {kind}
        </span>
        <span className="min-w-0 flex-1 truncate text-subheading leading-none text-black">
          {name}
        </span>
        <button
          type="button"
          aria-label={`More actions for ${name}`}
          className="shrink-0 text-black transition-opacity hover:opacity-70"
        >
          <EllipsisVertical className="h-[16px] w-[16px]" strokeWidth={2.5} aria-hidden />
        </button>
      </figcaption>

      <Image
        src={thumbnail}
        alt={`Preview of ${name}`}
        width={474}
        height={298}
        className="mt-[12px] h-[149px] w-full rounded-[4px] bg-white object-cover object-top"
      />
    </figure>
  );
}
