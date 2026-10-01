"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "./kit/Modal";
import Empty from "./kit/Empty";
import { flatNav, navForUser, type PortalUser } from "./portal-nav";
import { searchPortal, type SearchHit } from "@/lib/search-actions";

type Hit = SearchHit & { key: string };

export default function CommandPalette({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [remote, setRemote] = useState<SearchHit[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = () => {
    setQ("");
    setSel(0);
    setRemote([]);
    setOpen(true);
  };

  const pages = useMemo<SearchHit[]>(() => {
    const nav = flatNav(navForUser(user)).map((n) => ({ group: "Pages" as const, title: n.label, sub: "Go to page", href: n.href }));
    const extra = [
      { group: "Pages" as const, title: "Profile", sub: "Go to page", href: "/portal/profile" },
      { group: "Pages" as const, title: "My Activity", sub: "Go to page", href: "/portal/my-activity" },
    ];
    const seen = new Set<string>();
    return [...nav, ...extra].filter((p) => (seen.has(p.href) ? false : (seen.add(p.href), true)));
  }, [user]);

  useEffect(() => {
    if (user.role === "internal_accreditor") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        reset();
      }
    };
    const onOpen = () => reset();
    document.addEventListener("keydown", onKey);
    document.addEventListener("qacwards:open-command-palette", onOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("qacwards:open-command-palette", onOpen);
    };
  }, [user.role]);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      const hits = await searchPortal(term);
      if (live) setRemote(hits);
    }, 180);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const results: Hit[] = useMemo(() => {
    const term = q.toLowerCase().trim();
    const p = term ? pages.filter((x) => `${x.title} ${x.sub}`.toLowerCase().includes(term)) : pages;
    return [...p, ...(term.length >= 2 ? remote : [])].slice(0, 14).map((h, i) => ({ ...h, key: `${h.group}${i}${h.href}` }));
  }, [q, pages, remote]);

  function go(i: number) {
    const h = results[i];
    if (!h) return;
    setOpen(false);
    router.push(h.href);
  }

  if (!open) return null;

  let group = "";
  return (
    <Modal onClose={() => setOpen(false)} size="pal">
      <div className="pal" style={{ margin: "-18px -24px" }}>
        <div className="pi">
          ⌕
          <input
            ref={input}
            value={q}
            placeholder="Search pages, documents, events…"
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const n = results.length || 1;
                setSel((sel + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
              }
              if (e.key === "Enter") go(sel);
            }}
          />
          <kbd style={{ fontSize: 10, border: "1px solid #ccc", borderRadius: 4, padding: "1px 5px", color: "#777" }}>Esc</kbd>
        </div>
        <div style={{ maxHeight: "60vh", overflow: "auto", paddingBottom: 8 }}>
          {results.length ? (
            results.map((r, i) => {
              const head = r.group !== group ? ((group = r.group), <div className="grp">{r.group}</div>) : null;
              return (
                <div key={r.key}>
                  {head}
                  <div className={`pr2${i === sel ? " k" : ""}`} onClick={() => go(i)}>
                    {r.group === "Documents" ? "📄" : r.group === "Events" ? "🗓" : "↗"} <span>{r.title}</span>
                    <small>{r.sub}</small>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty>No results for “{q}”.</Empty>
          )}
        </div>
      </div>
    </Modal>
  );
}
