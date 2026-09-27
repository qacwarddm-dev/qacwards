"use client";

import { EllipsisVertical } from "lucide-react";
import { useState } from "react";

export type MenuItem = {
  label: string;
  onSelect?: () => void;
  href?: string;
};

/** The ⋮ overflow menu on folders and files (Rename / Download / Delete). */
export default function ActionMenu({
  label,
  items,
  size = 16,
}: {
  label: string;
  items: MenuItem[];
  size?: 14 | 16;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-maroon transition-opacity hover:opacity-70"
      >
        <EllipsisVertical
          style={{ width: size, height: size }}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            className="fixed inset-0 z-20 cursor-default"
          />
          <ul
            role="menu"
            aria-label={`Actions for ${label}`}
            className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[150px] overflow-hidden rounded-lg bg-white py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          >
            {items.map((item) => {
              const cls =
                "block w-full px-[20px] py-[10px] text-left text-subheading leading-none text-maroon transition-colors hover:bg-highlight";
              return (
                <li key={item.label} role="none">
                  {item.href ? (
                    <a role="menuitem" href={item.href} className={cls} onClick={() => setOpen(false)}>
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className={cls}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpen(false);
                        item.onSelect?.();
                      }}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </span>
  );
}
