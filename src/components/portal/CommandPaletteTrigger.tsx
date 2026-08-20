"use client";

import { Search } from "lucide-react";

/** Discoverability affordance for `CommandPalette`'s ⌘K shortcut — not
 *  everyone tries a shortcut unprompted. Dispatches the same DOM event the
 *  palette listens for; kept a client component only because the top bar
 *  that renders it is a server component and can't hold an onClick itself. */
export default function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      aria-label="Search (Ctrl+K)"
      onClick={() => document.dispatchEvent(new Event("qacwards:open-command-palette"))}
      className="hidden h-[32px] items-center gap-2 rounded-full bg-white/15 px-3 text-small text-white/80 transition-colors hover:bg-white/25 sm:flex"
    >
      <Search className="h-[14px] w-[14px]" strokeWidth={2} aria-hidden />
      Search
      <kbd className="rounded border border-white/30 px-1 text-[9px]">⌘K</kbd>
    </button>
  );
}
