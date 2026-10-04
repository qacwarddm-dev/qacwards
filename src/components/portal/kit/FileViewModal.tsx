"use client";

import Btn from "./Btn";
import Modal from "./Modal";
import PdfFrame from "./PdfFrame";

/** A QAC file shown view-only: embedded, watermarked with the viewer's name. No download unless `downloadHref` is given. */
export default function FileViewModal({
  title,
  sub,
  src,
  viewer,
  own,
  downloadHref,
  onClose,
}: {
  title: string;
  sub?: string;
  src: string | null;
  viewer?: string;
  own?: boolean;
  downloadHref?: string;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <Modal
      size="wide"
      title={title}
      sub={sub ?? (own ? "Your upload" : downloadHref ? "From the Quality Assurance Center" : "🔒 View only · from the Quality Assurance Center")}
      onClose={onClose}
      bodyStyle={{ background: "#e9e9e9" }}
      footer={
        <>
          {!own && !downloadHref && (
            <span className="sub" style={{ margin: "0 auto 0 0", fontSize: 11.5 }}>
              Downloading and printing are disabled for QAC files.
            </span>
          )}
          <Btn variant={downloadHref ? "o" : "s"} onClick={onClose}>
            Close
          </Btn>
          {downloadHref && (
            <Btn href={downloadHref} download>
              ⬇ Download
            </Btn>
          )}
        </>
      }
    >
      <div className="vwrap" style={{ maxWidth: 720, height: "70vh" }} onContextMenu={(e) => e.preventDefault()}>
        {src ? <PdfFrame src={`${src}${src.includes("#") ? "" : "#toolbar=0&navpanes=0"}`} title={title} /> : <img src="/assets/portal/mockup/preview.jpg" alt="" draggable={false} />}
        {!own && !downloadHref && viewer && (
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
