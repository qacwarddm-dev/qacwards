"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useClientValue from "./useClientValue";
import { Scoped } from "./Scope";

export const LAYER_ID = "qp-layer";

export const getLayer = () => document.getElementById(LAYER_ID);

export default function Modal({
  open = true,
  onClose,
  title,
  sub,
  size,
  locked,
  topColor,
  head,
  footer,
  footerStyle,
  bodyStyle,
  children,
}: {
  open?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  sub?: React.ReactNode;
  size?: "wide" | "pal";
  locked?: boolean;
  topColor?: string;
  head?: React.ReactNode;
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const layer = useClientValue(getLayer, null);
  const mdRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const lockedRef = useRef(locked);
  useEffect(() => {
    closeRef.current = onClose;
    lockedRef.current = locked;
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lockedRef.current) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    mdRef.current?.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const node = (
    <div
      className="ov show"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !locked) onClose();
      }}
    >
      <div ref={mdRef} className={size ? `md ${size}` : "md"} role="dialog" aria-modal="true">
        {head}
        {title !== undefined && (
          <div className="md-h" style={topColor ? { borderTop: `6px solid ${topColor}`, borderRadius: "20px 20px 0 0" } : undefined}>
            {!locked && (
              <button type="button" className="x" aria-label="Close" onClick={onClose}>
                ×
              </button>
            )}
            <h3>{title}</h3>
            {sub !== undefined && <p>{sub}</p>}
          </div>
        )}
        {children !== undefined && children !== null && (
          <div className="md-b" style={bodyStyle}>
            {children}
          </div>
        )}
        {footer && (
          <div className="md-f" style={footerStyle}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return layer ? createPortal(<Scoped>{node}</Scoped>, layer) : node;
}
