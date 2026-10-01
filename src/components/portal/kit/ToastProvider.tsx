"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type Toast = {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  push(t: Toast): void;
  say(message: string, error?: boolean): void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const say = useCallback((text: string, err = false, duration = 2600) => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ text, err });
    setShow(true);
    timer.current = setTimeout(() => setShow(false), duration);
  }, []);

  const push = useCallback(
    (t: Toast) => {
      const text = t.description ? `${t.title}. ${t.description}` : t.title;
      say(text, t.tone === "error" || t.tone === "warning", t.duration ?? 2600);
    },
    [say],
  );

  const value = useMemo(() => ({ push, say: (m: string, e?: boolean) => say(m, e) }), [push, say]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast${show ? " show" : ""}${msg?.err ? " err" : ""}`} role="status" aria-live="polite">
        {msg ? `${msg.err ? "⚠" : "✓"} ${msg.text}` : null}
      </div>
    </ToastContext.Provider>
  );
}
