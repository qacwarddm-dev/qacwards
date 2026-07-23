"use client";

import { LayoutGrid, Menu } from "lucide-react";
import { useState } from "react";

export type BrowserView = "list" | "grid";

/**
 * Segmented list/grid switch in the browser toolbar. The prototype shows grid
 * selected (solid maroon half) with the list half white.
 */
export default function ViewToggle({
  value,
  onChange,
}: {
  value?: BrowserView;
  onChange?: (v: BrowserView) => void;
}) {
  const [internal, setInternal] = useState<BrowserView>("grid");
  const current = value ?? internal;
  const set = (v: BrowserView) => {
    setInternal(v);
    onChange?.(v);
  };

  const half = (v: BrowserView, Icon: typeof Menu, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={current === v}
      onClick={() => set(v)}
      className={`flex h-full w-[34px] items-center justify-center ${
        current === v ? "bg-maroon text-white" : "bg-white text-maroon"
      }`}
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
    </button>
  );

  return (
    <div className="flex h-[32px] shrink-0 overflow-hidden rounded-full border border-maroon">
      {half("list", Menu, "List view")}
      {half("grid", LayoutGrid, "Grid view")}
    </div>
  );
}
