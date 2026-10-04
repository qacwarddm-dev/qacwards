"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Scoped } from "./Scope";
import { getLayer } from "./Modal";
import useClientValue from "./useClientValue";
import { pdfSrc, useDocUrl } from "./DocViewer";
import PdfFrame from "./PdfFrame";
import Spinner from "./Spinner";

export default function FullScreenViewer({
  docId,
  url: directUrl,
  file,
  meta,
  pages,
  status,
  panelLabel,
  panel,
  note = "View only · program files can’t be downloaded or printed from here",
  downloadHref,
  onClose,
}: {
  docId?: string | null;
  url?: string | null;
  file: string;
  meta: string;
  pages?: number | null;
  status?: React.ReactNode;
  panelLabel?: string;
  panel?: React.ReactNode;
  note?: string;
  downloadHref?: string;
  onClose: () => void;
}) {
  const { url: fetched, error } = useDocUrl(directUrl ? null : (docId ?? null));
  const url = directUrl ?? fetched;
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showPanel, setShowPanel] = useState(() => typeof window !== "undefined" && window.innerWidth > 820);
  const layer = useClientValue(getLayer, null);
  const total = pages ?? null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "Escape") return onClose();
      if (/INPUT|TEXTAREA/.test(tag)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") setPage((p) => (total ? Math.min(total, p + 1) : p + 1));
      if (e.key === "ArrowLeft" || e.key === "PageUp") setPage((p) => Math.max(1, p - 1));
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(250, z + 25));
      if (e.key === "-") setZoom((z) => Math.max(50, z - 25));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  const go = (p: number) => setPage(Math.max(1, total ? Math.min(total, p) : p));

  const node = (
    <div className="fsview show" role="dialog" aria-modal="true" aria-label={file}>
      <div className="fsbar">
        <div className="fn">
          <span className="pdfi2">PDF</span>
          <div>
            <b>{file}</b>
            <small>{meta}</small>
          </div>
        </div>
        <div className="fsg">
          <button type="button" onClick={() => go(page - 1)} title="Previous page">
            ‹
          </button>
          <span>
            <input value={page} onChange={(e) => go(parseInt(e.target.value) || 1)} aria-label="Page" /> / {total ?? "—"}
          </span>
          <button type="button" onClick={() => go(page + 1)} title="Next page">
            ›
          </button>
        </div>
        <div className="fsg zm">
          <button type="button" onClick={() => setZoom(Math.max(50, zoom - 25))} title="Zoom out">
            −
          </button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => setZoom(Math.min(250, zoom + 25))} title="Zoom in">
            ＋
          </button>
          <button type="button" onClick={() => setZoom(100)} title="Fit width">
            Fit
          </button>
        </div>
        {status}
        {downloadHref && (
          <div className="fsg">
            <a href={downloadHref} download title="Download this file">
              ⬇ Download
            </a>
          </div>
        )}
        {panel && (
          <div className="fsg">
            <button type="button" className={showPanel ? "on" : ""} onClick={() => setShowPanel(!showPanel)}>
              ☰ {panelLabel ?? "Review"}
            </button>
          </div>
        )}
        <button type="button" className="fsx" onClick={onClose}>
          ✕ Close <span style={{ opacity: 0.5, fontWeight: 500 }}>Esc</span>
        </button>
      </div>
      <div className="fsb">
        <div className="fsp" style={{ padding: 0, alignItems: "stretch", position: "relative" }}>
          {url ? (
            <PdfFrame src={pdfSrc(url, page, zoom === 100 ? undefined : zoom)} title={file} style={{ flex: 1, minHeight: "100%" }} />
          ) : (
            <div style={{ margin: "auto" }}>
              {error ? <span style={{ color: "#bbb" }}>{error}</span> : <Spinner label="Loading document…" />}
            </div>
          )}
        </div>
        {panel && <div className={`fss${showPanel ? "" : " hide"}`}>{panel}</div>}
      </div>
      <div className="fsnote">{note}</div>
    </div>
  );
  return layer ? createPortal(<Scoped>{node}</Scoped>, layer) : node;
}
