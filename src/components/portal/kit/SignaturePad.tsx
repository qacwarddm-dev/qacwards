"use client";

import { useEffect, useRef, useState } from "react";
import Button from "./Button";

/**
 * Capture an e-signature — round 2 §4.
 *
 * Both input methods the client's open question lists, because the answer is
 * not in yet and building one of them would be a guess that has to be redone:
 * **Draw** is a pointer track on a canvas, **Type** renders the name in the
 * footer serif. Either way the export is one PNG on transparency from the same
 * canvas, so the storage shape, the bucket's MIME whitelist and every render
 * site are identical whichever the client picks — dropping the losing tab later
 * is a UI deletion, not a data migration.
 *
 * Uploading an image of a wet signature is deliberately *not* offered. A file
 * picker accepts any image from anywhere; the two modes here can only produce a
 * mark the signer made in front of the screen.
 *
 * The typed face is `--font-footer` (Inria Serif). Canvas cannot resolve a CSS
 * variable, so the family is read back off a probe element rather than
 * hardcoded — which also means the fallback stack applies if the webfont has
 * not loaded.
 */
const CANVAS = { width: 600, height: 200 };
const STROKE = 2.5;

export type SignatureMode = "draw" | "type";

export default function SignaturePad({
  onChange,
  disabled = false,
  defaultTypedValue = "",
}: {
  /** The current mark as a PNG blob, or null once it is cleared. */
  onChange: (png: Blob | null) => void;
  disabled?: boolean;
  /** Prefills the Type tab — the accreditor's own name, normally. */
  defaultTypedValue?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typed, setTyped] = useState(defaultTypedValue);
  // Only the drawn half needs remembering: in Type mode the text field already
  // says whether there is a mark, so deriving it keeps the repaint effect free
  // of setState.
  const [drew, setDrew] = useState(false);
  const hasMark = mode === "type" ? typed.trim().length > 0 : drew;

  function context() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = STROKE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    return ctx;
  }

  function wipe() {
    const ctx = context();
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  }

  function publish() {
    canvasRef.current?.toBlob((blob) => onChange(blob), "image/png");
  }

  /** Canvas pixels from a pointer event — the element is laid out responsively
   *  and is almost never at its intrinsic 600x200, so the ratio has to be
   *  applied or the stroke lands away from the cursor. */
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS.width,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS.height,
    };
  }

  function startStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || mode !== "draw") return;
    const ctx = context();
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // A tap with no movement is a full stop, and a signature is entitled to
    // contain one — without this the dot never gets painted.
    ctx.lineTo(x, y);
    ctx.stroke();
    setDrew(true);
  }

  function extendStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = context();
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endStroke() {
    if (!drawing.current) return;
    drawing.current = false;
    publish();
  }

  // Typed mode repaints from scratch on every keystroke: the text is the whole
  // picture, so there is nothing to preserve underneath it.
  useEffect(() => {
    if (mode !== "type") return;
    const ctx = context();
    if (!ctx) return;

    wipe();
    const text = typed.trim();
    if (!text) {
      onChange(null);
      return;
    }

    const family =
      (probeRef.current && getComputedStyle(probeRef.current).fontFamily) || "serif";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Shrink to fit rather than clip: a long name must still read as a whole
    // signature, and a mark cut off at the edge is worse than a smaller one.
    let size = 72;
    ctx.font = `italic ${size}px ${family}`;
    while (size > 20 && ctx.measureText(text).width > CANVAS.width - 60) {
      size -= 4;
      ctx.font = `italic ${size}px ${family}`;
    }

    ctx.fillText(text, CANVAS.width / 2, CANVAS.height / 2);
    publish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is recreated per render by the caller; repainting on the text and mode is the intent
  }, [typed, mode]);

  function switchMode(next: SignatureMode) {
    if (next === mode) return;
    setMode(next);
    wipe();
    setDrew(false);
    onChange(null);
  }

  function clear() {
    wipe();
    setTyped("");
    setDrew(false);
    onChange(null);
  }

  return (
    <div>
      <span
        ref={probeRef}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 overflow-hidden font-footer"
      />

      <div role="group" aria-label="Signature input method" className="flex gap-[8px]">
        <Button
          variant={mode === "draw" ? "solid" : "ghost"}
          size="md"
          disabled={disabled}
          aria-pressed={mode === "draw"}
          onClick={() => switchMode("draw")}
        >
          Draw
        </Button>
        <Button
          variant={mode === "type" ? "solid" : "ghost"}
          size="md"
          disabled={disabled}
          aria-pressed={mode === "type"}
          onClick={() => switchMode("type")}
        >
          Type
        </Button>
      </div>

      {mode === "type" && (
        <label className="mt-[12px] block">
          <span className="t-sm font-semibold text-black">Your name as you sign it</span>
          <input
            type="text"
            value={typed}
            disabled={disabled}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-[6px] h-[36px] w-full rounded-[var(--radius-md)] border border-[color:var(--color-gray)]/40 bg-white px-[12px] text-regular text-black"
          />
        </label>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS.width}
        height={CANVAS.height}
        onPointerDown={startStroke}
        onPointerMove={extendStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        aria-label={mode === "draw" ? "Draw your signature" : "Signature preview"}
        className={`mt-[12px] w-full rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-gray)]/50 bg-white ${
          mode === "draw" && !disabled ? "cursor-crosshair touch-none" : ""
        }`}
        style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
      />

      <div className="mt-[10px] flex items-center justify-between">
        <p className="t-sm text-gray">
          {mode === "draw"
            ? "Sign inside the box with a mouse, trackpad or finger."
            : "Typed signatures are rendered in the system's serif."}
        </p>
        <Button variant="link" disabled={disabled || !hasMark} onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
