"use client";

import { useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";

export const isDocx = (name: string) => /\.docx$/i.test(name);

export default function DocxFrame({ src, zoom = 100 }: { src: string; zoom?: number }) {
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
        if (live) setState("ready");
      } catch {
        if (live) setState("error");
      }
    })();
    return () => {
      live = false;
      if (el) el.innerHTML = "";
    };
  }, [src]);
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
