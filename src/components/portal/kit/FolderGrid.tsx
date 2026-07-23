import FolderCard from "./FolderCard";

export type FolderEntry = {
  name: string;
  slug: string;
  badge?: string;
};

/**
 * Seven-column folder grid. Measured 114.5px tiles, 40px apart horizontally and
 * 50px vertically; the grid is what makes every document screen line up.
 */
export default function FolderGrid({
  entries,
  hrefFor,
}: {
  entries: FolderEntry[];
  hrefFor: (entry: FolderEntry) => string;
}) {
  return (
    <div className="grid grid-cols-7 justify-items-center gap-x-[40px] gap-y-[51.5px]">
      {entries.map((entry) => (
        <FolderCard
          key={entry.slug}
          label={entry.name}
          href={hrefFor(entry)}
          badge={entry.badge}
        />
      ))}
    </div>
  );
}
