import Image from "next/image";

import { RichText } from "./RichText";

export type Campus = {
  name: string;
  photo: string;
  body: string;
};

/**
 * One campus. The prototype rendered these as a bare photo with two centred
 * paragraphs under it and nothing binding the two together — at three across,
 * a reader could not tell where one campus ended and the next began, and the
 * centred 15px body ran to ~90 characters a line.
 *
 * Now: a real card with a hairline and a gold rule under the name, ragged-right
 * body copy at a readable measure, and the photograph as the only thing that
 * moves on hover.
 */
export function CampusCard({ campus }: { campus: Campus }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-white transition-shadow duration-[var(--motion-base)] hover:shadow-[var(--elev-2)]">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-surface)]">
        <Image
          src={campus.photo}
          alt=""
          fill
          sizes="(min-width: 1180px) 373px, (min-width: 768px) 45vw, 92vw"
          className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-[1.04]"
        />
      </div>

      <div className="flex flex-1 flex-col p-[var(--space-6)]">
        <h3 className="t-h2 font-qac uppercase text-maroon">{campus.name}</h3>
        <span aria-hidden className="mt-3 h-[2px] w-10 bg-yellow" />
        <p className="t-sm mt-4 leading-[1.7] text-black/80">
          <RichText text={campus.body} />
        </p>
      </div>
    </article>
  );
}
