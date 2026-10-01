"use client";

import { useRef, useState } from "react";

const MAX = 25 * 1024 * 1024;

export default function FileDrop({
  exts,
  label = "Choose a file or drag it here",
  hint,
  file,
  onFile,
  className,
}: {
  exts: string[];
  label?: string;
  hint: string;
  file: File | null;
  onFile: (f: File | null) => void;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const pick = (f?: File | null) => {
    if (!f) return;
    setErr("");
    if (!exts.some((e) => f.name.toLowerCase().endsWith(e))) {
      setErr(exts.length === 1 && exts[0] === ".pdf" ? "PDF files only" : `Wrong file type. Use ${exts.join(",")}.`);
      return onFile(null);
    }
    if (f.size > MAX) {
      setErr("File is over 25 MB.");
      return onFile(null);
    }
    onFile(f);
  };
  return (
    <>
      <div
        className={`drop${className ? ` ${className}` : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        <div style={{ fontSize: 26 }}>⬆</div>
        <b>{file ? `📄 ${file.name}` : label}</b>
        <small>{hint}</small>
        <input ref={input} type="file" accept={exts.join(",")} hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {err && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{err}</div>}
    </>
  );
}
