"use client";

import { DotsButton, MenuList, useItemMenu, type MenuItem } from "./ItemMenu";

export default function FolderTile({ onOpen, items, note, file, children }: { onOpen: () => void; items?: MenuItem[]; note?: string; file?: boolean; children: React.ReactNode }) {
  const m = useItemMenu(items?.length ?? 0);
  return (
    <div
      className={`fold${file ? " ftile" : ""}`}
      role="link"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      onContextMenu={
        items
          ? (e) => {
              e.preventDefault();
              m.openAt(e.clientX, e.clientY);
            }
          : undefined
      }
    >
      {children}
      {items && <DotsButton label="Options" active={Boolean(m.at)} onOpen={m.openAt} />}
      {items && m.at && <MenuList at={m.at} items={items} note={note} onClose={m.close} />}
    </div>
  );
}
