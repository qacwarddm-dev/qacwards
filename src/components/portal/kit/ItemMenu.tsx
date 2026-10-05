"use client";

import { useEffect, useState } from "react";

export type MenuItem = { label: string; onClick: () => void; danger?: boolean; disabled?: boolean };

const WIDTH = 190;

export function useItemMenu(count: number) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", esc);
    };
  }, [at]);

  const openAt = (x: number, y: number) => {
    const height = count * 40 + 20;
    setAt({ x: Math.max(8, Math.min(x, window.innerWidth - WIDTH - 8)), y: Math.max(8, Math.min(y, window.innerHeight - height - 8)) });
  };
  return { at, openAt, close: () => setAt(null) };
}

export function DotsButton({ label, active, row, onOpen }: { label: string; active: boolean; row?: boolean; onOpen: (x: number, y: number) => void }) {
  return (
    <button
      type="button"
      className={`fdots${row ? " row" : ""}${active ? " on" : ""}`}
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={active}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onOpen(r.right - WIDTH, r.bottom + 4);
      }}
    >
      ⋮
    </button>
  );
}

export function MenuList({ at, items, note, onClose }: { at: { x: number; y: number }; items: MenuItem[]; note?: string; onClose: () => void }) {
  return (
    <ul className="imenu" role="menu" style={{ left: at.x, top: at.y, width: WIDTH }} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
      {items.map((it) => (
        <li key={it.label} role="none">
          <button
            type="button"
            role="menuitem"
            className={it.danger ? "dng" : undefined}
            disabled={it.disabled}
            onClick={() => {
              onClose();
              it.onClick();
            }}
          >
            {it.label}
          </button>
        </li>
      ))}
      {note && <li className="inote">{note}</li>}
    </ul>
  );
}
