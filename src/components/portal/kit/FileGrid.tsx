"use client";

export type FileTileItem = { id: string; name: string; sub?: string };

export default function FileGrid({ items, onOpen }: { items: FileTileItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="fgrid">
      {items.map((f) => (
        <div key={f.id} className="fold ftile" role="button" tabIndex={0} onClick={() => onOpen(f.id)} onKeyDown={(e) => e.key === "Enter" && onOpen(f.id)}>
          <div className="fpg">
            <span className="pdfi">PDF</span>
          </div>
          <div className="n">{f.name}</div>
          {f.sub && <small>{f.sub}</small>}
        </div>
      ))}
    </div>
  );
}
