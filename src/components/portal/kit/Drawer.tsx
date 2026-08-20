"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/** Off-canvas panel — the portal sidebar below `md` (09b §5: `translateX`,
 *  `--motion-slow`, `--ease-inout`). Same focus-trap/Escape/scroll-lock
 *  mechanics as `Dialog`, specialised for a side-anchored panel. */
export default function Drawer({
  open,
  onOpenChange,
  side = "left",
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  title: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = panelRef.current;
    const focusable = () =>
      node?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    focusable()?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (!items || items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`absolute top-0 h-full w-[280px] max-w-[85vw] overflow-y-auto bg-white outline-none motion-safe:animate-[drawer-in_var(--motion-slow)_var(--ease-inout)] ${
          side === "left" ? "left-0" : "right-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[color:var(--hairline)] p-[var(--space-4)]">
          <span className="t-h2 text-black">{title}</span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="text-black transition-opacity hover:opacity-60"
          >
            <X className="h-[20px] w-[20px]" strokeWidth={2} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
