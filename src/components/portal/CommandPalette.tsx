"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { PORTAL_NAV, type PortalUser } from "./portal-nav";

const EXTRA_ROUTES = [
  { label: "Profile", href: "/portal/profile" },
  { label: "Notifications", href: "/portal/notifications" },
];

/**
 * Global ⌘K / Ctrl+K route jump (09a §E.1). Scoped to routes the signed-in
 * role can already reach — the portal has no single cross-entity search
 * query yet (programmes/documents/people each live behind their own RLS-
 * scoped read), so this is the part of the target that ships now rather than
 * a fabricated search across data this refactor didn't verify is safe to
 * query generically.
 */
export default function CommandPalette({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const routes = useMemo(() => {
    const nav = PORTAL_NAV[user.role] ?? [];
    const seen = new Set<string>();
    return [...nav.map((n) => ({ label: n.label, href: n.href })), ...EXTRA_ROUTES].filter(
      (r) => (seen.has(r.href) ? false : (seen.add(r.href), true)),
    );
  }, [user.role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter((r) => r.label.toLowerCase().includes(q));
  }, [routes, query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    // The top bar's search button has no direct handle on this component's
    // state (it renders once, in the layout, above the tree the button lives
    // in) — a DOM event is the least-ceremony way to open from there too.
    function onOpenEvent() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("qacwards:open-command-palette", onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("qacwards:open-command-palette", onOpenEvent);
    };
  }, []);

  // Reset during render (not an effect) when `open` flips true, so the reset
  // state is what the same commit paints — see Navbar's route-change reset
  // for the same pattern. The focus() call is a real DOM side effect and
  // stays in an effect below.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setActiveIndex(0);
  }

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      go(results[activeIndex].href);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 pt-[15vh]">
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a screen"
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--elev-3)]"
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--hairline)] px-4 py-3">
          <Search className="h-[18px] w-[18px] shrink-0 text-gray" strokeWidth={2} aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to…"
            aria-label="Jump to a screen"
            className="min-w-0 flex-1 bg-transparent text-subheading text-black outline-none placeholder:text-gray"
          />
          <kbd className="rounded border border-[color:var(--hairline)] px-1.5 py-0.5 text-[10px] text-gray">
            Esc
          </kbd>
        </div>
        <ul role="listbox" aria-label="Results" className="max-h-[320px] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-3 text-regular text-gray">No matches.</li>
          )}
          {results.map((r, i) => (
            <li key={r.href}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(r.href)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-subheading text-black ${
                  i === activeIndex ? "bg-highlight" : ""
                }`}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
