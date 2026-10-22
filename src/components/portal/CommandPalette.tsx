"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useNav from "./kit/nav";
import Modal from "./kit/Modal";
import Empty from "./kit/Empty";
import Spinner, { MiniRing } from "./kit/Spinner";
import Btn from "./kit/Btn";
import FilterPills from "./kit/FilterPills";
import FullScreenViewer from "./kit/FullScreenViewer";
import { useToast } from "./kit/ToastProvider";
import { flatNav, navForUser, type PortalUser } from "./portal-nav";
import { locateMatch, searchPortal, type SearchHit } from "@/lib/search-actions";

type Hit = SearchHit & { key: string };

/** A document hit opened straight in its file. */
type Opened = { hit: SearchHit; url: string; fileName: string; page: number | null; pages: number | null; words: string[] };

export default function CommandPalette({ user }: { user: PortalUser }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [remote, setRemote] = useState<SearchHit[]>([]);
  const [found, setFound] = useState("");
  const recent = useRef(new Map<string, { at: number; hits: SearchHit[] }>());
  const [scope, setScope] = useState<"all" | SearchHit["group"]>("all");
  const [opened, setOpened] = useState<Opened | null>(null);
  const [opening, setOpening] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useNav();
  const toast = useToast();

  const reset = () => {
    setQ("");
    setSel(0);
    setRemote([]);
    setFound("");
    setScope("all");
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
      // Retyping or backspacing to a term seen in the last minute needs no new round trip.
      const seen = recent.current.get(term.toLowerCase());
      const hits = seen && Date.now() - seen.at < 60_000 ? seen.hits : await searchPortal(term);
      recent.current.set(term.toLowerCase(), { at: Date.now(), hits });
      if (!live) return;
      setRemote(hits);
      setFound(term);
    }, 180);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const results: Hit[] = useMemo(() => {
    const term = q.toLowerCase().trim();
    const p = term ? pages.filter((x) => `${x.title} ${x.sub}`.toLowerCase().includes(term)) : pages;
    return [...p, ...(term.length >= 2 ? remote : [])]
      .filter((h) => scope === "all" || h.group === scope)
      .slice(0, 14)
      .map((h, i) => ({ ...h, key: `${h.group}${i}${h.href}` }));
  }, [q, pages, remote, scope]);

  const searching = q.trim().length >= 2 && found !== q.trim();

  async function go(i: number) {
    const h = results[i];
    if (!h || opening) return;
    if (!h.file) {
      setOpen(false);
      router.push(h.href);
      return;
    }
    setOpening(true);
    const res = await locateMatch(h.file.kind, h.file.id, q).catch(() => null);
    setOpening(false);
    if (!res || !res.ok) {
      toast.say(res && !res.ok ? res.error : "Could not open that file.", true);
      return;
    }
    setOpen(false);
    setOpened({ hit: h, url: `/api/documents/download?source=${res.source}&id=${res.id}`, fileName: res.fileName, page: res.page, pages: res.pages, words: res.words });
  }

  const viewer = opened && (
    <FullScreenViewer
      url={opened.url}
      file={opened.fileName}
      meta={[opened.hit.title, opened.hit.sub, opened.page ? `Page ${opened.page}${opened.pages ? ` of ${opened.pages}` : ""} · first match` : null].filter(Boolean).join(" · ")}
      pages={opened.pages}
      startPage={opened.page}
      highlight={opened.words}
      panelLabel="Where it lives"
      panel={
        <>
          <h4>FOUND FOR “{opened.words.join(" ")}”</h4>
          <div className="sub">{opened.hit.sub || opened.hit.title}</div>
          <Btn
            variant="o"
            onClick={() => {
              const href = opened.hit.href;
              setOpened(null);
              router.push(href);
            }}
          >
            Open where it is filed ›
          </Btn>
        </>
      }
      onClose={() => setOpened(null)}
    />
  );

  if (!open) return viewer || null;

  let group = "";
  return (
    <>
    {viewer}
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
              if (e.key === "Enter") void go(sel);
            }}
          />
          {(searching || opening) && <MiniRing />}
          <kbd style={{ fontSize: 10, border: "1px solid #ccc", borderRadius: 4, padding: "1px 5px", color: "#777" }}>Esc</kbd>
        </div>
        <div style={{ padding: "8px 16px 0" }}>
          <FilterPills
            flush
            value={scope}
            onChange={(k) => {
              setScope(k);
              setSel(0);
            }}
            items={[
              { key: "all", label: "All" },
              { key: "Pages", label: "Pages" },
              { key: "Documents", label: "Documents" },
              { key: "Events", label: "Events" },
            ]}
          />
        </div>
        <div style={{ maxHeight: "60vh", overflow: "auto", paddingBottom: 8 }}>
          {results.length ? (
            results.map((r, i) => {
              const head = r.group !== group ? ((group = r.group), <div className="grp">{r.group}</div>) : null;
              return (
                <div key={r.key}>
                  {head}
                  <div className={`pr2${i === sel ? " k" : ""}`} onClick={() => void go(i)}>
                    {r.group === "Documents" ? "📄" : r.group === "Events" ? "🗓" : "↗"}{" "}
                    <span>
                      {r.title}
                      {r.snippet && (
                        <em className="pr2s">
                          {r.snippet.split(/[«»]/).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : part))}
                        </em>
                      )}
                    </span>
                    <small>{r.sub}</small>
                  </div>
                </div>
              );
            })
          ) : searching ? (
            <Spinner label="Searching…" />
          ) : (
            <Empty>No results for “{q}”.</Empty>
          )}
        </div>
      </div>
    </Modal>
    </>
  );
}
