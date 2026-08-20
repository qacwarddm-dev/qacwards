import DocCard from "./DocCard";

export type DocFile = { id: string; title: string };

/**
 * Grid of `DocCard`s behind a repository folder, or the "this folder is empty"
 * message when there are none. Shared by the Program Rep Reports tab and the
 * QAC campus/college repository tree — both are the same `repository_files`
 * read (`getRepositoryFiles`, src/lib/documents.ts), just scoped to a
 * different set of programmes.
 */
export default function DocFileGrid({ files }: { files: DocFile[] }) {
  if (files.length === 0) {
    return (
      <p className="mt-[60px] text-center text-subheading text-gray">
        This folder is empty.
      </p>
    );
  }

  return (
    <div className="mt-[16px] grid grid-cols-4 gap-x-[27px] gap-y-[27px]">
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
