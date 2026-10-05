"use client";

import { DotsButton, MenuList, useItemMenu, type MenuItem } from "./ItemMenu";

export type FolderRowItem = { key: string; name: string; n: number; open: () => void; items?: MenuItem[]; note?: string };

function FolderRow({ r }: { r: FolderRowItem }) {
  const m = useItemMenu(r.items?.length ?? 0);
  return (
    <tr
      className="click"
      onClick={r.open}
      onContextMenu={
        r.items
          ? (e) => {
              e.preventDefault();
              m.openAt(e.clientX, e.clientY);
            }
          : undefined
      }
    >
      <td>📁 {r.name}</td>
      <td>{r.n}</td>
      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <span className="lnk">Open ›</span>
        {r.items && <DotsButton row label="Options" active={Boolean(m.at)} onOpen={m.openAt} />}
        {r.items && m.at && <MenuList at={m.at} items={r.items} note={r.note} onClose={m.close} />}
      </td>
    </tr>
  );
}

export default function FolderTable({ rows }: { rows: FolderRowItem[] }) {
  return (
    <table>
      <tbody>
        <tr>
          <th>Folder</th>
          <th>Files</th>
          <th />
        </tr>
        {rows.map((r) => (
          <FolderRow key={r.key} r={r} />
        ))}
      </tbody>
    </table>
  );
}
