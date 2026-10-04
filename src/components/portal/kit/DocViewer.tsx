"use client";

import { useEffect, useState } from "react";
import { getDocumentUrl } from "@/lib/submission-actions";
import PdfFrame from "./PdfFrame";
import Spinner from "./Spinner";

export function useDocUrl(docId: string | null) {
  const [res, setRes] = useState<{ id: string; url: string | null; error: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    if (docId)
      getDocumentUrl(docId).then((r) => {
        if (live) setRes({ id: docId, url: r.ok ? r.url : null, error: r.ok ? null : r.error });
      });
    return () => {
      live = false;
    };
  }, [docId]);
  const cur = docId && res?.id === docId ? res : null;
  return { url: cur?.url ?? null, error: cur?.error ?? null };
}

export function pdfSrc(url: string, page = 1, zoom?: number) {
  return `${url}#toolbar=0&navpanes=0&page=${page}${zoom ? `&zoom=${zoom}` : "&view=FitH"}`;
}

/** The in-card preview: view-only, watermarked, with a Full screen button. */
export default function DocViewer({
  docId,
  url: direct,
  pages,
  onFullscreen,
  empty = "Nothing to preview",
  height,
}: {
  docId: string | null;
  url?: string | null;
  pages?: number | null;
  onFullscreen?: () => void;
  empty?: string;
  height?: number;
}) {
  const { url: fetched, error } = useDocUrl(direct ? null : docId);
  const url = direct ?? fetched;
  const has = Boolean(docId || direct);
  return (
    <div className="vw" style={height ? { height } : undefined} onDoubleClick={onFullscreen} title={has ? "Double-click to view full screen" : undefined}>
      {has ? (
        <>
          {onFullscreen && (
            <div className="tb">
              Page 1{pages ? ` of ${pages}` : ""}
              <button type="button" onClick={onFullscreen}>
                ⛶ Full screen
              </button>
            </div>
          )}
          {url ? (
            <PdfFrame src={pdfSrc(url)} title="Document preview" />
          ) : error ? (
            <span style={{ color: "#999", fontSize: 13 }}>{error}</span>
          ) : (
            <Spinner label="Loading document…" />
          )}
        </>
      ) : (
        <span style={{ color: "#999", fontSize: 13 }}>{empty}</span>
      )}
    </div>
  );
}
