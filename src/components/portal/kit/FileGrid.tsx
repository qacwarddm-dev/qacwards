"use client";

import FolderTile from "./FolderTile";
import type { MenuItem } from "./ItemMenu";

export type FileTileItem = { id: string; name: string; sub?: string; menu?: MenuItem[] };

export default function FileGrid({ items, onOpen }: { items: FileTileItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="fgrid">
      {items.map((f) => (
        <FolderTile key={f.id} file onOpen={() => onOpen(f.id)} items={f.menu}>
          <div className="fpg">
            <span className="pdfi">PDF</span>
          </div>
          <div className="n">{f.name}</div>
          {f.sub && <small>{f.sub}</small>}
        </FolderTile>
      ))}
    </div>
  );
}
