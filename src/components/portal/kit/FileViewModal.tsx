"use client";

import Btn from "./Btn";
import Modal from "./Modal";

/** A QAC file shown view-only: embedded, watermarked with the viewer's name, no download. */
export default function FileViewModal({
  title,
  sub,
  src,
  viewer,
  own,
  onClose,
}: {
  title: string;
  sub?: string;
  src: string | null;
  viewer?: string;
  own?: boolean;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <Modal
      size="wide"
      title={title}
      sub={sub ?? (own ? "Your upload" : "🔒 View only · from the Quality Assurance Center")}
      onClose={onClose}
      bodyStyle={{ background: "#e9e9e9" }}
      footer={
        <>
          {!own && (
            <span className="sub" style={{ margin: "0 auto 0 0", fontSize: 11.5 }}>
              Downloading and printing are disabled for QAC files.
            </span>
          )}
          <Btn onClick={onClose}>Close</Btn>
        </>
      }
    >
      <div className="vwrap" style={{ maxWidth: 720, height: "70vh" }} onContextMenu={(e) => e.preventDefault()}>
        {src ? <iframe className="pdfview" src={`${src}${src.includes("#") ? "" : "#toolbar=0&navpanes=0"}`} title={title} /> : <img src="/assets/portal/mockup/preview.jpg" alt="" draggable={false} />}
        {!own && viewer && (
          <div className="wm">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i}>
                VIEW ONLY · {viewer} · {today}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
