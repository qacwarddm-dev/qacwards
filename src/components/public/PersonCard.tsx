import Image from "next/image";

export type Person = {
  name: string;
  role: string;
  photo: string;
  width: number;
  height: number;
};

/**
 * One official. Portraits ship from the client with a 5px frame baked into the
 * PNG, so the frame is part of the file and the box uses `object-contain` — a
 * cover crop would slice the frame off. A fixed 3/4 box is what lets a mixed
 * set (the director's 279x399 next to the staff's 233x310) grid without the
 * rows going ragged, which the old `flex-wrap` + `gap-x-[106px]` /
 * `gap-x-[130px]` pair could not do.
 */
export function PersonCard({ person }: { person: Person }) {
  return (
    <figure className="group flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] bg-white/60">
        <Image
          src={person.photo}
          alt=""
          width={person.width}
          height={person.height}
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 70vw"
          className="absolute inset-0 h-full w-full object-contain object-bottom transition-transform duration-[var(--motion-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
        />
      </div>
      <span aria-hidden className="mt-5 h-[2px] w-10 bg-yellow" />
      <figcaption className="mt-4">
        {/* Two-line floor on the name so the roles sit on one baseline across a
            row; names here run one line or two and nothing else aligns them. */}
        <p className="t-h2 text-maroon sm:min-h-[2.6em]">{person.name}</p>
        <p className="t-sm mt-1 text-black/70">{person.role}</p>
      </figcaption>
    </figure>
  );
}
