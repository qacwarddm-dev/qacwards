"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";

export const isDocx = (name: string) => /\.docx$/i.test(name);

/** Wraps every occurrence of the searched words in <mark> and scrolls the first one into view. */
function markWords(root: HTMLElement, words: string[]) {
  const pattern = `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`;
  const rx = new RegExp(pattern, "gi");
  const has = new RegExp(pattern, "i");
  const nodes: Text[] = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) if (has.test(n.nodeValue ?? "")) nodes.push(n as Text);
  let first: HTMLElement | null = null;
  for (const node of nodes.slice(0, 400)) {
    const frag = document.createDocumentFragment();
    for (const part of (node.nodeValue ?? "").split(rx)) {
      if (!part) continue;
      if (words.includes(part.toLowerCase())) {
        const m = document.createElement("mark");
        m.className = "docxhit";
        m.textContent = part;
        first ??= m;
        frag.append(m);
      } else frag.append(part);
    }
    node.replaceWith(frag);
  }
  (first as HTMLElement | null)?.scrollIntoView({ block: "center" });
}

export default function DocxFrame({ src, zoom = 100, highlight }: { src: string; zoom?: number; highlight?: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let live = true;
    const el = host.current;
    (async () => {
      try {
        const res = await fetch(src, { credentials: "same-origin" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const { renderAsync } = await import("docx-preview");
        if (!live || !el) return;
        el.innerHTML = "";
        await renderAsync(blob, el, undefined, { inWrapper: true, ignoreWidth: false, breakPages: true, useBase64URL: true });
        if (highlight?.length) markWords(el, highlight);
        if (live) setState("ready");
      } catch {
        if (live) setState("error");
      }
    })();
    return () => {
      live = false;
      if (el) el.innerHTML = "";
    };
  }, [src, highlight?.join(" ")]);
  return (
    <div className="docxview">
      {state === "loading" && (
        <div className="q-frame-wait">
          <Spinner label="Loading document…" />
        </div>
      )}
      {state === "error" && <div className="docxview-err">This document could not be previewed.</div>}
      <div ref={host} className="docxview-host" style={zoom === 100 ? undefined : { zoom: zoom / 100 }} />
    </div>
  );
}
