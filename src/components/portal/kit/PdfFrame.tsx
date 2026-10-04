"use client";

import { useEffect, useState } from "react";
import Spinner from "./Spinner";

// Browsers that hand PDFs to a download instead of an inline viewer never fire onLoad.
const FAILSAFE_MS = 12000;

function Frame({ src, title, style }: { src: string; title: string; style?: React.CSSProperties }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), FAILSAFE_MS);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {!ready && (
        <div className="q-frame-wait">
          <Spinner label="Loading document…" />
        </div>
      )}
      <iframe className="pdfview" src={src} title={title} style={style} onLoad={() => setReady(true)} />
    </>
  );
}

export default function PdfFrame(props: { src: string; title: string; style?: React.CSSProperties }) {
  return <Frame key={props.src} {...props} />;
}
