import DocCard from "./DocCard";
import EmptyState from "./EmptyState";

export type DocFile = { id: string; title: string };

/**
 * Grid of `DocCard`s behind a repository folder, or the "this folder is empty"
 * message when there are none. Shared by the Program Rep Reports tab and the
 * QAC campus/college repository tree — both are the same `repository_files`
 * read (`getRepositoryFiles`, src/lib/documents.ts), just scoped to a
 * different set of programmes.
 *
 * The grid was a fixed `grid-cols-4` tuned for the 1440px frame (09-ui-refactor
 * §6.3/D.2) — `auto-fit` gives the same 4-up at that width while adapting down
 * to one column on a phone instead of clipping.
 */
export default function DocFileGrid({ files }: { files: DocFile[] }) {
  if (files.length === 0) {
    return <EmptyState variant="empty" title="This folder is empty." />;
  }

  return (
    <div className="mt-[16px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-[27px] gap-y-[27px]">
      {files.map((f) => (
        <DocCard
          key={f.id}
          title={f.title}
          href={`/api/documents/download?source=repository&id=${f.id}`}
        />
      ))}
    </div>
  );
}
