import { FileText, Folder } from "lucide-react";
import Link from "next/link";
import ActionMenu, { type MenuItem } from "./ActionMenu";

export type FileListEntry = {
  id: string;
  kind: "folder" | "file";
  name: string;
  owner?: string;
  modified?: string;
  size?: string;
  href?: string;
  menu?: MenuItem[];
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HEAD = "px-[12px] py-[10px] text-left text-regular font-normal leading-none text-gray";
const CELL = "px-[12px] py-[11px] text-regular leading-none text-black";

/** List view of a document browser — the Drive-style alternative to the tile grid. */
export default function FileList({ entries }: { entries: FileListEntry[] }) {
  return (
    <table className="w-full border-collapse">
      <caption className="sr-only">Files</caption>
      <thead>
        <tr className="border-b border-[color:var(--color-gray)]/25">
          <th scope="col" className={HEAD}>Name</th>
          <th scope="col" className={`${HEAD} w-[200px]`}>Owner</th>
          <th scope="col" className={`${HEAD} w-[160px]`}>Date modified</th>
          <th scope="col" className={`${HEAD} w-[110px]`}>File size</th>
          <th scope="col" className="w-[40px]">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const Icon = e.kind === "folder" ? Folder : FileText;
          const name = (
            <span className="flex min-w-0 items-center gap-[12px]">
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${e.kind === "folder" ? "fill-yellow text-yellow" : "text-maroon"}`}
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">{e.name}</span>
            </span>
          );
          return (
            <tr
              key={e.id}
              className="border-b border-[color:var(--color-gray)]/15 transition-colors hover:bg-surface"
            >
              <td className={`${CELL} max-w-0`}>
                {e.href ? (
                  <Link href={e.href} className="block hover:text-maroon">
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </td>
              <td className={`${CELL} truncate`}>{e.owner ?? "—"}</td>
              <td className={CELL}>{e.modified ?? "—"}</td>
              <td className={CELL}>{e.size ?? "—"}</td>
              <td className="px-[8px] text-right">
                {e.menu && <ActionMenu label={e.name} items={e.menu} />}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
