"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Btn from "./Btn";
import { useToast } from "./ToastProvider";
import { saveSignature } from "@/lib/accreditor-actions";
import { logSelfActivity } from "@/lib/profile-actions";

type Mode = "draw" | "type" | "upload";

export function useSignaturePad(width = 520, height = 150) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let active: number | null = null;
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return [((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height] as const;
    };
    const start = (e: PointerEvent) => {
      if (active !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
      active = e.pointerId;
      try {
        c.setPointerCapture(e.pointerId);
      } catch {
        // capture is only a nicety; drawing still works without it
      }
      const [x, y] = pos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.01, y);
      ctx.strokeStyle = "#1f3a7a";
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      setDrawn(true);
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      const batch = e.getCoalescedEvents?.() ?? [];
      for (const p of batch.length ? batch : [e]) {
        const [x, y] = pos(p);
        ctx.lineWidth = p.pointerType === "pen" && p.pressure > 0 ? 1.2 + p.pressure * 2.6 : 2.4;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
      e.preventDefault();
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = null;
      if (c.hasPointerCapture?.(e.pointerId)) c.releasePointerCapture(e.pointerId);
    };
    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", end);
      c.removeEventListener("pointercancel", end);
    };
  }, []);
  function clear() {
    const c = canvas.current;
    if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setDrawn(false);
  }
  function typeText(text: string) {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!text.trim()) return setDrawn(false);
    ctx.fillStyle = "#1f3a7a";
    ctx.font = `44px "Brush Script MT", "Segoe Script", cursive`;
    ctx.textBaseline = "middle";
    ctx.fillText(text, 20, c.height / 2);
    setDrawn(true);
  }
  async function loadImage(file: File) {
    const c = canvas.current;
    if (!c) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res) => {
      img.onload = res;
      img.src = url;
    });
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    const k = Math.min(c.width / img.width, c.height / img.height);
    ctx.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);
    URL.revokeObjectURL(url);
    setDrawn(true);
  }
  async function blob(): Promise<Blob | null> {
    return new Promise((res) => {
      const c = canvas.current;
      if (!c) return res(null);
      c.toBlob((b) => res(b), "image/png");
    });
  }
  return { canvas, drawn, clear, typeText, loadImage, blob, width, height };
}

export function useSaveSignature() {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function save(b: Blob | null, verb: "Saved" | "Uploaded" = "Saved") {
    if (!b) return false;
    setBusy(true);
    const fd = new FormData();
    fd.set("signature", new File([b], "signature.png", { type: "image/png" }));
    const r = await saveSignature(fd);
    setBusy(false);
    if (!r.ok) {
      toast.say(r.error, true);
      return false;
    }
    await logSelfActivity(verb === "Uploaded" ? "signature_uploaded" : "signature_saved");
    toast.say(verb === "Uploaded" ? "Signature uploaded" : "Signature saved");
    router.refresh();
    return true;
  }
  return { save, busy };
}

/** Internal Accreditor e-signature: Draw / Type / Upload tabs over one canvas. */
export default function SignatureTabs({ savedUrl }: { savedUrl: string | null }) {
  const hasSaved = Boolean(savedUrl);
  const { canvas: padCanvas, width: padWidth, height: padHeight, ...pad } = useSignaturePad(520, 150);
  const { save, busy } = useSaveSignature();
  const [mode, setMode] = useState<Mode>("draw");
  const [typed, setTyped] = useState("");
  const [msg, setMsg] = useState(hasSaved ? "Using your saved signature" : "No signature saved yet");
  const file = useRef<HTMLInputElement>(null);
  return (
    <>
      <div className="sigc" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginBottom: 8, letterSpacing: ".04em" }}>SAVED SIGNATURE</div>
        {savedUrl ? <img src={savedUrl} alt="Your saved signature" /> : <span className="sub">No signature saved yet</span>}
      </div>
      <div className="inner">
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["draw", "type", "upload"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`tab${mode === m ? " on" : ""}`}
              onClick={() => {
                setMode(m);
                pad.clear();
                if (m === "upload") file.current?.click();
              }}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {mode === "type" && (
          <input
            className="sel"
            style={{ margin: "0 0 8px" }}
            placeholder="Type your full name"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              pad.typeText(e.target.value);
              setMsg("Unsaved signature");
            }}
          />
        )}
        <input
          ref={file}
          type="file"
          accept="image/png"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pad.loadImage(f).then(() => setMsg("Unsaved signature"));
          }}
        />
        <canvas ref={padCanvas} className="sigpad" width={padWidth} height={padHeight} onPointerUp={() => pad.drawn && setMsg("Unsaved signature")} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", marginTop: 6 }}>
          <span>{mode === "draw" ? "Sign inside the box with a mouse, trackpad or finger." : mode === "type" ? "Your typed name is rendered as a signature." : "PNG with a transparent background works best."}</span>
          <a
            className="lnk"
            role="button"
            onClick={() => {
              pad.clear();
              setTyped("");
              setMsg(hasSaved ? "Using your saved signature" : "No signature saved yet");
            }}
          >
            Clear
          </a>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{msg}</span>
        <Btn
          disabled={!pad.drawn || busy}
          onClick={async () => {
            if (await save(await pad.blob(), mode === "upload" ? "Uploaded" : "Saved")) {
              pad.clear();
              setMsg("Saved. It will be used when you sign.");
            }
          }}
        >
          Save signature
        </Btn>
      </div>
    </>
  );
}
